import { notFound } from "next/navigation";
import DetalleLibro from "@/components/DetalleLibro";
import SupabaseMissing from "@/components/SupabaseMissing";
import { isUuid } from "@/lib/ids";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Book, BookNote } from "@/lib/types";

export default async function LibroPage({
  params,
  searchParams,
}: PageProps<"/pila/[id]">) {
  if (!hasSupabaseEnv) {
    return <SupabaseMissing />;
  }

  const { id } = await params;
  if (!isUuid(id)) notFound();

  const query = await searchParams;
  const error = typeof query.error === "string" ? query.error : null;

  const supabase = await createClient();
  const { data: book } = await supabase
    .from("books")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  // Un libro que no existe o que es de otra persona no se encuentra (la base de datos no lo devuelve).
  if (!book) notFound();

  const { data: notes, error: notesError } = await supabase
    .from("book_notes")
    .select("*")
    .eq("book_id", id)
    .order("created_at", { ascending: false });

  return (
    <DetalleLibro
      book={book as Book}
      notes={(notes ?? []) as BookNote[]}
      notesFailed={Boolean(notesError)}
      error={error}
    />
  );
}
