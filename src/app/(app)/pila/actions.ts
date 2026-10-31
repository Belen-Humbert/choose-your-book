"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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
  if (!hasDigital && !hasPhysical) {
    backToForm("Marcá si lo tenés en digital, en físico o en ambos.");
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
  } = { status };

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
  const defaultFormat = String(formData.get("formato") ?? "fisico");

  if (!(file instanceof File) || file.size === 0) {
    backToImport("Elegí el archivo CSV que descargaste de Goodreads.");
  }
  if (file.size > IMPORT_MAX_BYTES) {
    backToImport("El archivo es demasiado grande (máximo 2 MB).");
  }

  const parsed = parseGoodreadsExport(await file.text());
  if (!parsed) {
    backToImport(
      "Ese archivo no parece un export de Goodreads. Tiene que ser el CSV de “Importar y exportar”.",
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
    .select("title, author");
  if (readError) {
    backToImport("No pudimos revisar tu pila. Probá de nuevo.");
  }
  const seen = new Set((existing ?? []).map((b) => bookKey(b.title, b.author)));

  const rows = [];
  let repeated = 0;
  for (const b of wanted) {
    const key = bookKey(b.title, b.author);
    if (seen.has(key)) {
      repeated++;
      continue;
    }
    seen.add(key);
    const format = b.format ?? (defaultFormat === "digital" ? "digital" : "fisico");
    const done = b.status === "leido" && b.pages;
    rows.push({
      title: b.title,
      author: b.author,
      pages: b.pages,
      status: b.status,
      has_digital: format === "digital",
      has_physical: format === "fisico",
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

  revalidatePath("/pila");
  revalidatePath("/");
  redirect(`/pila?importados=${rows.length}&repetidos=${repeated}`);
}
