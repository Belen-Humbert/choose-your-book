"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { searchBooks } from "@/lib/bookSearch";
import { enrichQuery, pickMatch } from "@/lib/enrich";
import { bookKey, parseGoodreadsExport } from "@/lib/goodreadsCsv";
import { isUuid } from "@/lib/ids";
import { NOTE_MAX_LENGTH } from "@/lib/notes";
import { bookPercent, pageFromPercent, progressPercent } from "@/lib/progress";
import { COVERS_BUCKET, coverStoragePath } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import type { BookStatus } from "@/lib/types";

function backToForm(message: string): never {
  redirect(`/pila/nueva?error=${encodeURIComponent(message)}`);
}

// Solo aceptamos portadas con https; cualquier otra cosa se descarta.
function cleanCoverUrl(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? "").trim();
  if (!text || text.length > 500) return null;
  try {
    return new URL(text).protocol === "https:" ? text : null;
  } catch {
    return null;
  }
}

export async function addBook(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const author = String(formData.get("author") ?? "").trim();
  const genre = String(formData.get("genre") ?? "").trim();
  const pages = Number.parseInt(String(formData.get("pages") ?? ""), 10);
  const googleBooksId = String(formData.get("google_books_id") ?? "").trim();
  const hasDigital = formData.get("digital") === "on";
  const hasPhysical = formData.get("fisico") === "on";

  if (!title) {
    backToForm("Falta el título.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("books").insert({
    title,
    author: author || null,
    genre: genre || null,
    pages: Number.isFinite(pages) && pages > 0 ? pages : null,
    cover_url: cleanCoverUrl(formData.get("cover_url")),
    google_books_id: googleBooksId && googleBooksId.length <= 50 ? googleBooksId : null,
    has_digital: hasDigital,
    has_physical: hasPhysical,
  });
  if (error) {
    // 23505: el índice único (usuario + libro de Google Books) ya tiene este libro.
    backToForm(
      error.code === "23505"
        ? "Ese libro ya está en tu pila."
        : "No pudimos guardar el libro. Probá de nuevo.",
    );
  }

  revalidatePath("/pila");
  revalidatePath("/");
  redirect("/pila");
}

export async function deleteBook(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const { data: book } = await supabase
    .from("books")
    .select("cover_url")
    .eq("id", id)
    .maybeSingle();
  const { error } = await supabase.from("books").delete().eq("id", id);

  // Si la portada la subió la persona, borramos también el archivo para no dejarlo suelto.
  const path = coverStoragePath(book?.cover_url);
  if (!error && path) {
    await supabase.storage.from(COVERS_BUCKET).remove([path]);
  }

  revalidatePath("/pila");
  revalidatePath("/");
}

// Actualiza dónde va el libro, por página o por porcentaje (lo que muestre el lector digital),
// y si viene una nota la guarda con esa misma posición. Nunca pasa del total si lo conocemos.
export async function updateProgress(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const mode = String(formData.get("mode") ?? "");
  const value = Number.parseInt(String(formData.get("value") ?? ""), 10);
  const body = String(formData.get("body") ?? "").trim().slice(0, NOTE_MAX_LENGTH);

  if (!isUuid(id) || (mode !== "pagina" && mode !== "porcentaje")) return;
  if (!Number.isFinite(value) || value < 0) return;

  const supabase = await createClient();
  const { data: book } = await supabase
    .from("books")
    .select("pages")
    .eq("id", id)
    .maybeSingle();
  if (!book) return;

  const total: number | null = book.pages;
  let page: number;
  let percent: number | null;
  if (mode === "porcentaje") {
    percent = Math.min(100, value);
    // Sin total de páginas no se puede saber la página: queda solo el porcentaje.
    page = total ? pageFromPercent(percent, total) : 0;
  } else {
    page = Math.min(value, total ?? 10000);
    percent = total ? progressPercent(page, total) : null;
  }

  const { error } = await supabase
    .from("books")
    .update({ current_page: page, current_percent: percent })
    .eq("id", id);
  if (error) {
    backToBook(id, "No pudimos guardar el progreso. Probá de nuevo.");
  }

  if (body) {
    const { error: noteError } = await supabase.from("book_notes").insert({
      book_id: id,
      body,
      page: page > 0 ? page : null,
      percent: percent !== null && percent > 0 ? percent : null,
    });
    if (noteError) {
      backToBook(id, "Guardamos el progreso, pero no pudimos guardar la nota.");
    }
  }

  revalidatePath("/pila");
  revalidatePath("/pila/[id]", "page");
  revalidatePath("/");
}

const STATUSES: BookStatus[] = ["pendiente", "leyendo", "leido"];

// Cambia el estado de lectura de un libro (por leer → leyendo → leído).
export async function setStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as BookStatus;
  if (!id || !STATUSES.includes(status)) return;

  const supabase = await createClient();
  const changes: {
    status: BookStatus;
    current_page?: number;
    current_percent?: number;
    finished_at?: string | null;
  } = { status, finished_at: status === "leido" ? new Date().toISOString() : null };

  // Al terminar un libro, el progreso queda completo (si sabemos cuántas páginas tiene).
  if (status === "leido") {
    const { data: book } = await supabase
      .from("books")
      .select("pages")
      .eq("id", id)
      .maybeSingle();
    if (book?.pages) {
      changes.current_page = book.pages;
      changes.current_percent = 100;
    }
  }

  await supabase.from("books").update(changes).eq("id", id);

  revalidatePath("/pila");
  revalidatePath("/pila/[id]", "page");
  revalidatePath("/");

  // Desde la ruleta, al empezar a leer te llevamos a la lista de "Leyendo".
  if (formData.get("ir") === "leyendo") {
    redirect("/pila?estado=leyendo");
  }
}

function backToBook(bookId: string, message: string): never {
  redirect(`/pila/${bookId}?error=${encodeURIComponent(message)}`);
}

// Guarda una nota suelta del libro (sin tocar el progreso). La fecha y la hora las pone la
// base de datos; la página y el porcentaje son los que tenía el libro en ese momento.
export async function addNote(formData: FormData) {
  const bookId = String(formData.get("book_id") ?? "");
  const body = String(formData.get("body") ?? "").trim().slice(0, NOTE_MAX_LENGTH);
  if (!isUuid(bookId) || !body) return;

  const supabase = await createClient();
  const { data: book } = await supabase
    .from("books")
    .select("pages, current_page, current_percent")
    .eq("id", bookId)
    .maybeSingle();
  if (!book) return;

  const percent = bookPercent(book);
  const { error } = await supabase.from("book_notes").insert({
    book_id: bookId,
    body,
    page: book.current_page > 0 ? book.current_page : null,
    percent: percent !== null && percent > 0 ? percent : null,
  });
  if (error) {
    backToBook(bookId, "No pudimos guardar la nota. Probá de nuevo.");
  }

  revalidatePath(`/pila/${bookId}`);
}

export async function deleteNote(formData: FormData) {
  const noteId = String(formData.get("note_id") ?? "");
  const bookId = String(formData.get("book_id") ?? "");
  if (!isUuid(noteId) || !isUuid(bookId)) return;

  const supabase = await createClient();
  await supabase.from("book_notes").delete().eq("id", noteId);

  revalidatePath(`/pila/${bookId}`);
}

const IMPORT_MAX_BYTES = 2 * 1024 * 1024;
const IMPORT_MAX_BOOKS = 1000;

function backToImport(message: string): never {
  redirect(`/pila/importar?error=${encodeURIComponent(message)}`);
}

// Importa un export CSV de Goodreads. Salta los libros que ya están en la pila.
export async function importGoodreads(formData: FormData) {
  const file = formData.get("archivo");
  const only = String(formData.get("que") ?? "por-leer");

  if (!(file instanceof File) || file.size === 0) {
    backToImport("Elegí el archivo CSV que descargaste de Goodreads.");
  }
  if (file.size > IMPORT_MAX_BYTES) {
    backToImport("El archivo es demasiado grande (máximo 2 MB).");
  }

  const parsed = parseGoodreadsExport(await file.text());
  if (!parsed) {
    backToImport(
      "Ese archivo no parece un export de Goodreads. Tiene que ser el CSV de “Importación/Exportación”.",
    );
  }

  const wanted = parsed.filter((b) => only === "todo" || b.status === "pendiente");
  if (wanted.length === 0) {
    backToImport("No encontramos libros para importar en ese archivo.");
  }
  if (wanted.length > IMPORT_MAX_BOOKS) {
    backToImport(`El archivo tiene más de ${IMPORT_MAX_BOOKS} libros. Dividilo y subilo en partes.`);
  }

  const supabase = await createClient();
  const { data: existing, error: readError } = await supabase
    .from("books")
    .select("id, title, author, created_at, finished_at, rating");
  if (readError) {
    backToImport("No pudimos revisar tu pila. Probá de nuevo.");
  }
  const seen = new Map(
    (existing ?? []).map((b) => [bookKey(b.title, b.author), b] as const),
  );

  const rows = [];
  const redate: { id: string; changes: { created_at?: string; finished_at?: string; rating?: number } }[] = [];
  let repeated = 0;
  for (const b of wanted) {
    const key = bookKey(b.title, b.author);
    const already = seen.get(key);
    if (already) {
      repeated++;
      // Si ya estaba, le ponemos la fecha de Goodreads (así se ordena como allá).
      const changes: { created_at?: string; finished_at?: string; rating?: number } = {};
      if (b.addedAt && Date.parse(already.created_at) !== Date.parse(b.addedAt)) {
        changes.created_at = b.addedAt;
      }
      if (
        b.status === "leido" &&
        b.readAt &&
        (!already.finished_at || Date.parse(already.finished_at) !== Date.parse(b.readAt))
      ) {
        changes.finished_at = b.readAt;
      }
      if (b.status === "leido" && b.rating && already.rating !== b.rating) {
        changes.rating = b.rating;
      }
      if (Object.keys(changes).length > 0) redate.push({ id: already.id, changes });
      continue;
    }
    seen.set(key, { id: "", title: b.title, author: b.author, created_at: "", finished_at: null, rating: null });
    const done = b.status === "leido" && b.pages;
    rows.push({
      title: b.title,
      author: b.author,
      pages: b.pages,
      status: b.status,
      ...(b.addedAt ? { created_at: b.addedAt } : {}),
      ...(b.status === "leido" && b.readAt ? { finished_at: b.readAt } : {}),
      ...(b.status === "leido" && b.rating ? { rating: b.rating } : {}),
      has_digital: b.format === "digital",
      has_physical: b.format === "fisico",
      current_page: done ? b.pages : 0,
      current_percent: done ? 100 : null,
    });
  }

  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await supabase.from("books").insert(rows.slice(i, i + 200));
    if (error) {
      backToImport(
        i > 0
          ? `Se importaron ${i} libros, pero falló el resto. Volvé a subir el archivo: los repetidos se saltean.`
          : "No pudimos guardar los libros. Probá de nuevo.",
      );
    }
  }

  for (let i = 0; i < redate.length; i += 25) {
    await Promise.all(
      redate
        .slice(i, i + 25)
        .map((r) =>
          supabase.from("books").update(r.changes).eq("id", r.id),
        ),
    );
  }

  revalidatePath("/pila");
  revalidatePath("/");
  redirect(`/pila?importados=${rows.length}&repetidos=${repeated}`);
}

// Marca o desmarca un formato (digital / físico) de un libro. Puede quedar sin ninguno.
export async function toggleFormat(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const format = String(formData.get("formato") ?? "");
  if (!isUuid(id) || (format !== "digital" && format !== "fisico")) return;

  const supabase = await createClient();
  const { data: book } = await supabase
    .from("books")
    .select("has_digital, has_physical")
    .eq("id", id)
    .maybeSingle();
  if (!book) return;

  const changes =
    format === "digital"
      ? { has_digital: !book.has_digital }
      : { has_physical: !book.has_physical };
  await supabase.from("books").update(changes).eq("id", id);

  revalidatePath("/pila");
  revalidatePath("/pila/[id]", "page");
  revalidatePath("/");
}

// Completa género, páginas y portada de libros que no los tienen, buscándolos en Google Books
// (o en Open Library). Nunca pisa un dato que el libro ya tiene. Se llama de a pocos libros.
export async function completeBookData(
  ids: string[],
): Promise<{ updated: number; notFound: number }> {
  const batch = ids.filter(isUuid).slice(0, 6);
  if (batch.length === 0) return { updated: 0, notFound: 0 };

  const supabase = await createClient();
  const { data: books } = await supabase
    .from("books")
    .select("id, title, author, genre, pages, cover_url")
    .in("id", batch);

  let updated = 0;
  let notFound = 0;
  await Promise.all(
    (books ?? []).map(async (book) => {
      try {
        const { results } = await searchBooks(enrichQuery(book));
        const match = pickMatch(book, results);
        const changes: { genre?: string; pages?: number; cover_url?: string } = {};
        if (match) {
          if (!book.genre && match.genre) changes.genre = match.genre;
          if (!book.pages && match.pages) changes.pages = match.pages;
          if (!book.cover_url && match.coverUrl) changes.cover_url = match.coverUrl;
        }
        if (Object.keys(changes).length === 0) {
          notFound++;
          return;
        }
        const { error } = await supabase.from("books").update(changes).eq("id", book.id);
        if (error) notFound++;
        else updated++;
      } catch {
        notFound++;
      }
    }),
  );

  revalidatePath("/pila");
  revalidatePath("/");
  return { updated, notFound };
}

// Edita los datos de un libro. La fecha de lectura solo se toca en libros leídos.
export async function updateBook(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!isUuid(id)) return;
  const back = (message: string): never =>
    redirect(`/pila/${id}/editar?error=${encodeURIComponent(message)}`);

  const title = String(formData.get("title") ?? "").trim();
  const author = String(formData.get("author") ?? "").trim();
  const genre = String(formData.get("genre") ?? "").trim();
  const pages = Number.parseInt(String(formData.get("pages") ?? ""), 10);
  const finishedOn = String(formData.get("finished_on") ?? "").trim();
  if (!title) back("Falta el título.");

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("books")
    .select("status, cover_url, current_page, current_percent")
    .eq("id", id)
    .maybeSingle();
  if (!current) return;

  const newPages = Number.isFinite(pages) && pages > 0 && pages <= 10000 ? pages : null;
  const newCover = cleanCoverUrl(formData.get("cover_url"));
  const changes: Record<string, unknown> = {
    title: title.slice(0, 200),
    author: author.slice(0, 200) || null,
    genre: genre.slice(0, 50) || null,
    pages: newPages,
    cover_url: newCover,
    has_digital: formData.get("digital") === "on",
    has_physical: formData.get("fisico") === "on",
  };
  // Si cambió el total de páginas, el avance no puede quedar por encima.
  if (newPages && current.current_page > newPages) changes.current_page = newPages;

  if (current.status === "leido" && finishedOn) {
    const date = new Date(`${finishedOn}T12:00:00.000Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(finishedOn) || Number.isNaN(date.getTime())) {
      back("La fecha de lectura no es válida.");
    }
    if (date.getTime() > Date.now() + 864e5) back("La fecha de lectura no puede ser futura.");
    changes.finished_at = date.toISOString();
  }

  const { error } = await supabase.from("books").update(changes).eq("id", id);
  if (error) back("No pudimos guardar los cambios. Probá de nuevo.");

  // Si se reemplazó o quitó una portada subida por la persona, borramos el archivo anterior.
  const oldPath = coverStoragePath(current.cover_url);
  if (oldPath && current.cover_url !== newCover) {
    await supabase.storage.from(COVERS_BUCKET).remove([oldPath]);
  }

  revalidatePath("/pila");
  revalidatePath("/pila/[id]", "page");
  revalidatePath("/");
  redirect(`/pila/${id}`);
}

// Cambia el texto de una nota. Conserva la fecha, la hora y la posición en que se escribió.
export async function updateNote(formData: FormData) {
  const noteId = String(formData.get("note_id") ?? "");
  const bookId = String(formData.get("book_id") ?? "");
  const body = String(formData.get("body") ?? "").trim().slice(0, NOTE_MAX_LENGTH);
  if (!isUuid(noteId) || !isUuid(bookId) || !body) return;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("book_notes")
    .update({ body })
    .eq("id", noteId)
    .select("id");
  // Sin la migración 0008 la base no da error: simplemente no modifica ninguna fila.
  if (error || !data || data.length === 0) {
    backToBook(bookId, "No pudimos guardar los cambios de la nota. Probá de nuevo.");
  }

  revalidatePath(`/pila/${bookId}`);
  redirect(`/pila/${bookId}`);
}

// Pone o cambia las estrellas de un libro leído. 0 las quita.
export async function setRating(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const rating = Number.parseInt(String(formData.get("rating") ?? ""), 10);
  if (!isUuid(id) || !Number.isInteger(rating) || rating < 0 || rating > 5) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("books")
    .update({ rating: rating === 0 ? null : rating })
    .eq("id", id);
  if (error) {
    backToBook(id, "No pudimos guardar la calificación. Probá de nuevo.");
  }

  revalidatePath("/pila");
  revalidatePath("/pila/[id]", "page");
}
