"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

// Guarda la página por la que va el libro. Nunca pasa del total si lo conocemos.
export async function setProgress(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const raw = Number.parseInt(String(formData.get("page") ?? ""), 10);
  if (!id || !Number.isFinite(raw) || raw < 0) return;

  const supabase = await createClient();
  const { data: book } = await supabase
    .from("books")
    .select("pages")
    .eq("id", id)
    .maybeSingle();
  if (!book) return;

  const page = Math.min(raw, book.pages ?? 10000);
  await supabase.from("books").update({ current_page: page }).eq("id", id);

  revalidatePath("/pila");
  revalidatePath("/");
}

const STATUSES: BookStatus[] = ["pendiente", "leyendo", "leido"];

// Cambia el estado de lectura de un libro (por leer → leyendo → leído).
export async function setStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as BookStatus;
  if (!id || !STATUSES.includes(status)) return;

  const supabase = await createClient();
  const changes: { status: BookStatus; current_page?: number } = { status };

  // Al terminar un libro, el progreso queda completo (si sabemos cuántas páginas tiene).
  if (status === "leido") {
    const { data: book } = await supabase
      .from("books")
      .select("pages")
      .eq("id", id)
      .maybeSingle();
    if (book?.pages) changes.current_page = book.pages;
  }

  await supabase.from("books").update(changes).eq("id", id);

  revalidatePath("/pila");
  revalidatePath("/");

  // Desde la ruleta, al empezar a leer te llevamos a la lista de "Leyendo".
  if (formData.get("ir") === "leyendo") {
    redirect("/pila?estado=leyendo");
  }
}
