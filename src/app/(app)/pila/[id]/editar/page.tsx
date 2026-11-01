import { notFound } from "next/navigation";
import EditarLibro from "@/components/EditarLibro";
import SupabaseMissing from "@/components/SupabaseMissing";
import { isUuid } from "@/lib/ids";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Book } from "@/lib/types";

export default async function EditarPage({
  params,
  searchParams,
}: PageProps<"/pila/[id]/editar">) {
  if (!hasSupabaseEnv) return <SupabaseMissing />;

  const { id } = await params;
  if (!isUuid(id)) notFound();
  const query = await searchParams;
  const error = typeof query.error === "string" ? query.error : null;

  const supabase = await createClient();
  const { data: book } = await supabase.from("books").select("*").eq("id", id).maybeSingle();
  if (!book) notFound();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-5 py-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-ladrillo">Editar</p>
        <h1 className="mt-1.5 font-display text-4xl font-extrabold leading-[1.05] text-tinta">
          Datos del libro
        </h1>
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-ladrillo bg-ladrillo/25 px-4 py-3 text-sm text-tinta"
        >
          {error}
        </p>
      )}
      <EditarLibro book={book as Book} />
    </main>
  );
}
