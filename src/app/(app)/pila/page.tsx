import Link from "next/link";
import BookRow from "@/components/BookRow";
import SupabaseMissing from "@/components/SupabaseMissing";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Book, BookStatus } from "@/lib/types";

const TABS: { status: BookStatus; param: string; label: string }[] = [
  { status: "pendiente", param: "pendiente", label: "Por leer" },
  { status: "leyendo", param: "leyendo", label: "Leyendo" },
  { status: "leido", param: "leido", label: "Leídos" },
];

const FORMATS = [
  { label: "Todos", value: null },
  { label: "Digital", value: "digital" },
  { label: "Físico", value: "fisico" },
] as const;

const EMPTY: Record<BookStatus, { title: string; text: string }> = {
  pendiente: {
    title: "Tu pila está vacía",
    text: "Sumá tu primer libro y después la ruleta elige por vos.",
  },
  leyendo: {
    title: "No estás leyendo nada ahora",
    text: "Girá la ruleta o elegí un libro de tu pila y tocá “Empezar a leer”.",
  },
  leido: {
    title: "Todavía no terminaste ninguno",
    text: "Cuando termines un libro, marcalo con “Lo terminé” y queda acá.",
  },
};

function buildHref(estado: string, formato: string | null) {
  const query = new URLSearchParams();
  if (estado !== "pendiente") query.set("estado", estado);
  if (formato) query.set("formato", formato);
  const text = query.toString();
  return text ? `/pila?${text}` : "/pila";
}

const chip =
  "inline-flex h-11 items-center rounded-full border-[1.5px] px-4 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mostaza";

export default async function PilaPage({ searchParams }: PageProps<"/pila">) {
  if (!hasSupabaseEnv) {
    return <SupabaseMissing />;
  }

  const params = await searchParams;
  const imported = Number.parseInt(String(params.importados ?? ""), 10);
  const repeated = Number.parseInt(String(params.repetidos ?? ""), 10) || 0;
  const tab = TABS.find((t) => t.param === params.estado) ?? TABS[0];
  const formato =
    params.formato === "digital" || params.formato === "fisico"
      ? params.formato
      : null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .order("created_at", { ascending: false });

  const all = (data ?? []) as Book[];
  const counts = {
    pendiente: all.filter((b) => b.status === "pendiente").length,
    leyendo: all.filter((b) => b.status === "leyendo").length,
    leido: all.filter((b) => b.status === "leido").length,
  };
  const books = all.filter((book) => {
    if (book.status !== tab.status) return false;
    if (formato === "digital") return book.has_digital;
    if (formato === "fisico") return book.has_physical;
    return true;
  });

  const heading =
    tab.status === "pendiente"
      ? `${books.length} por leer`
      : tab.status === "leyendo"
        ? `${books.length} leyendo`
        : `${books.length} ${books.length === 1 ? "leído" : "leídos"}`;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-5 py-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-mostaza">
          Mi pila
        </p>
        <h1 className="mt-1.5 font-display text-5xl font-extrabold leading-[1.02] text-crema">
          {heading}
        </h1>
      </div>

      {Number.isFinite(imported) && (
        <p role="status" className="rounded-xl border border-mostaza bg-mostaza/15 px-4 py-3 text-sm text-crema">
          Importamos {imported} {imported === 1 ? "libro" : "libros"}
          {repeated > 0 ? ` y salteamos ${repeated} que ya tenías` : ""}.
        </p>
      )}

      <nav aria-label="Estado de lectura" className="flex gap-2">
        {TABS.map((t) => {
          const active = t.status === tab.status;
          return (
            <Link
              key={t.status}
              href={buildHref(t.param, formato)}
              aria-current={active ? "page" : undefined}
              className={`${chip} ${
                active
                  ? "border-petroleo bg-petroleo font-bold text-crema"
                  : "border-borde font-medium text-crema"
              }`}
            >
              {t.label}
              <span className="ml-1.5 text-xs opacity-80">{counts[t.status]}</span>
            </Link>
          );
        })}
      </nav>

      <nav aria-label="Formato" className="flex gap-2">
        {FORMATS.map((f) => {
          const active = f.value === formato;
          return (
            <Link
              key={f.label}
              href={buildHref(tab.param, f.value)}
              aria-current={active ? "true" : undefined}
              className={`${chip} ${
                active
                  ? "border-mostaza bg-mostaza font-bold text-tinta"
                  : "border-borde font-medium text-crema"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </nav>

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
              {formato ? "No hay libros con ese formato" : EMPTY[tab.status].title}
            </p>
            <p className="text-sm text-crema-suave">
              {formato
                ? "Probá con otro filtro."
                : EMPTY[tab.status].text}
            </p>
            {tab.status === "pendiente" && !formato && (
              <Link
                href="/pila/nueva"
                className="inline-flex h-12 items-center rounded-2xl bg-mostaza px-5 text-base font-bold text-tinta shadow-[0_4px_0_#9a6f10] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-crema"
              >
                Agregar un libro
              </Link>
            )}
          </div>
        )
      )}
    </main>
  );
}
