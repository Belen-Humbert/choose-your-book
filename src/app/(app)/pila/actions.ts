"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function backToForm(message: string): never {
  redirect(`/pila/nueva?error=${encodeURIComponent(message)}`);
}

export async function addBook(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const author = String(formData.get("author") ?? "").trim();
  const genre = String(formData.get("genre") ?? "").trim();
  const pages = Number.parseInt(String(formData.get("pages") ?? ""), 10);
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
    has_digital: hasDigital,
    has_physical: hasPhysical,
  });
  if (error) {
    backToForm("No pudimos guardar el libro. Probá de nuevo.");
  }

  revalidatePath("/pila");
  redirect("/pila");
}

export async function deleteBook(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("books").delete().eq("id", id);

  revalidatePath("/pila");
}
