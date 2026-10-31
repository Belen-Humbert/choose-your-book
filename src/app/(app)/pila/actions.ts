"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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
