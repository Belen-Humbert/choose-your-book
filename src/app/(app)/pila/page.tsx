import Link from "next/link";
import BookRow from "@/components/BookRow";
import SupabaseMissing from "@/components/SupabaseMissing";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Book } from "@/lib/types";

const FILTERS = [
  { label: "Todos", value: null, href: "/pila" },
  { label: "Digital", value: "digital", href: "/pila?formato=digital" },
  { label: "Físico", value: "fisico", href: "/pila?formato=fisico" },
] as const;

export default async function PilaPage({ searchParams }: PageProps<"/pila">) {
  if (!hasSupabaseEnv) {
    return <SupabaseMissing />;
  }

  const params = await searchParams;
  const formato =
    params.formato === "digital" || params.formato === "fisico"
      ? params.formato
      : null;

  const supabase = await createClient();
  let query = supabase
    .from("books")
    .select("*")
    .eq("status", "pendiente")
    .order("created_at", { ascending: false });
  if (formato === "digital") query = query.eq("has_digital", true);
  if (formato === "fisico") query = query.eq("has_physical", true);

  const { data, error } = await query;
  const books = (data ?? []) as Book[];

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-5 py-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-mostaza">
          Mi pila
        </p>
        <h1 className="mt-1.5 font-display text-5xl font-extrabold leading-[1.02] text-crema">
          {books.length} por leer
        </h1>
      </div>

      <div className="flex gap-2">
        {FILTERS.map((filter) => {
          const active = filter.value === formato;
          return (
            <Link
              key={filter.label}
              href={filter.href}
              aria-current={active ? "true" : undefined}
              className={`inline-flex h-11 items-center rounded-full border-[1.5px] px-4 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mostaza ${
                active
                  ? "border-mostaza bg-mostaza font-bold text-tinta"
                  : "border-borde font-medium text-crema"
              }`}
            >
              {filter.label}
            </Link>
          );
        })}
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-ladrillo bg-ladrillo/25 px-4 py-3 text-sm text-crema"
        >
          No pudimos cargar tu pila. Probá de nuevo en un rato.
        </p>
      )}

      {books.length > 0 ? (
        <ul className="flex flex-col gap-2.5">
          {books.map((book) => (
            <BookRow key={book.id} book={book} />
          ))}
        </ul>
      ) : (
        !error && (
          <div className="flex flex-col items-start gap-4 rounded-[14px] border border-borde bg-panel p-5">
            <p className="font-display text-2xl font-extrabold text-crema">
              {formato ? "No hay libros con ese formato" : "Tu pila está vacía"}
            </p>
            <p className="text-sm text-crema-suave">
              {formato
                ? "Probá con otro filtro o sumá un libro nuevo."
                : "Sumá tu primer libro y después la ruleta elige por vos."}
            </p>
            <Link
              href="/pila/nueva"
              className="inline-flex h-12 items-center rounded-2xl bg-mostaza px-5 text-base font-bold text-tinta shadow-[0_4px_0_#9a6f10] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-crema"
            >
              Agregar un libro
            </Link>
          </div>
        )
      )}
    </main>
  );
}
