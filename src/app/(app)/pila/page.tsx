import Link from "next/link";
import BookRow from "@/components/BookRow";
import CompletarDatos from "@/components/CompletarDatos";
import SupabaseMissing from "@/components/SupabaseMissing";
import { matchesQuery, sortBooks, type Orden } from "@/lib/pilaSearch";
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

function buildHref(
  estado: string,
  formato: string | null,
  q: string,
  orden: Orden,
) {
  const query = new URLSearchParams();
  if (estado !== "pendiente") query.set("estado", estado);
  if (formato) query.set("formato", formato);
  if (q) query.set("q", q);
  if (orden !== "nuevos") query.set("orden", orden);
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

  const q = (typeof params.q === "string" ? params.q : "").trim().slice(0, 100);
  const orden: Orden = params.orden === "viejos" ? "viejos" : "nuevos";

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
  const books = sortBooks(
    all.filter((book) => {
      if (book.status !== tab.status) return false;
      if (formato === "digital" && !book.has_digital) return false;
      if (formato === "fisico" && !book.has_physical) return false;
      return matchesQuery(book, q);
    }),
    orden,
  );

  // Libros por leer o leyendo a los que les falta género o portada.
  const incomplete = all
    .filter((b) => b.status !== "leido" && (!b.genre || !b.cover_url))
    .map((b) => b.id);

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
              href={buildHref(t.param, formato, q, orden)}
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

      {tab.status === "pendiente" && !q && !formato && (
        <CompletarDatos ids={incomplete} />
      )}

      <form role="search" action="/pila" className="flex flex-col gap-2">
        {tab.param !== "pendiente" && <input type="hidden" name="estado" value={tab.param} />}
        {formato && <input type="hidden" name="formato" value={formato} />}
        <div className="flex gap-2">
          <label htmlFor="buscar" className="sr-only">
            Buscar por título o autor
          </label>
          <input
            id="buscar"
            name="q"
            type="search"
            defaultValue={q}
            maxLength={100}
            placeholder="Buscar por título o autor"
            className="h-11 min-w-0 flex-1 rounded-full border-0 bg-crema px-4 text-base text-tinta placeholder:text-tinta/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mostaza"
          />
          <button
            type="submit"
            className="h-11 cursor-pointer rounded-full bg-mostaza px-5 text-sm font-bold text-tinta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crema"
          >
            Buscar
          </button>
        </div>
        <div className="flex items-center gap-2 text-sm text-crema-suave">
          <label htmlFor="orden">Ordenar por fecha en que lo agregué</label>
          <select
            id="orden"
            name="orden"
            defaultValue={orden}
            className="h-11 rounded-full border-0 bg-crema px-3 text-sm text-tinta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mostaza"
          >
            <option value="nuevos">Más nuevos primero</option>
            <option value="viejos">Más viejos primero</option>
          </select>
        </div>
        {(q || orden !== "nuevos") && (
          <Link
            href={buildHref(tab.param, formato, "", "nuevos")}
            className="inline-flex min-h-11 items-center self-start text-sm font-bold text-mostaza underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mostaza"
          >
            Limpiar búsqueda
          </Link>
        )}
      </form>

      <nav aria-label="Formato" className="flex gap-2">
        {FORMATS.map((f) => {
          const active = f.value === formato;
          return (
            <Link
              key={f.label}
              href={buildHref(tab.param, f.value, q, orden)}
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
              {q
                ? `Ningún libro coincide con “${q}”`
                : formato
                  ? "No hay libros con ese formato"
                  : EMPTY[tab.status].title}
            </p>
            <p className="text-sm text-crema-suave">
              {q || formato
                ? "Probá con otra palabra o con otro filtro."
                : EMPTY[tab.status].text}
            </p>
            {tab.status === "pendiente" && !formato && !q && (
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
