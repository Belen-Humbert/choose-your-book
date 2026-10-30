import { setProgress } from "@/app/(app)/pila/actions";
import { progressPercent } from "@/lib/progress";
import type { Book } from "@/lib/types";

function Barra({ percent, label }: { percent: number; label: string }) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className="h-3 w-full overflow-hidden rounded-full bg-tinta/60 ring-1 ring-inset ring-borde"
    >
      <div
        className="h-full rounded-full bg-mostaza transition-[width] duration-300 motion-reduce:transition-none"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

// Progreso de un libro que estás leyendo.
// compact: solo la barra y un resumen (para el inicio). Completo: con el campo para actualizar la página.
export default function ProgresoLectura({
  book,
  compact = false,
}: {
  book: Book;
  compact?: boolean;
}) {
  const percent = progressPercent(book.current_page, book.pages);
  const summary = book.pages
    ? `Página ${book.current_page} de ${book.pages}`
    : book.current_page > 0
      ? `Vas por la página ${book.current_page}`
      : "Todavía no empezaste";

  if (compact) {
    return (
      <div className="mt-1.5 flex flex-col gap-1.5">
        {percent !== null && (
          <Barra percent={percent} label={`Progreso de ${book.title}`} />
        )}
        <p className="text-xs text-crema-suave">
          {summary}
          {percent !== null ? ` · ${percent}%` : ""}
        </p>
      </div>
    );
  }

  const finished = book.pages !== null && book.current_page >= book.pages;

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-end justify-between gap-3">
          <p aria-live="polite" className="text-[13px] text-crema-suave">
            {summary}
          </p>
          {percent !== null && (
            <p className="font-display text-2xl font-extrabold leading-none text-mostaza">
              {percent}%
            </p>
          )}
        </div>
        {percent !== null && (
          <Barra percent={percent} label={`Progreso de ${book.title}`} />
        )}
      </div>

      {/* key: al guardar, el campo toma el valor nuevo que viene del servidor */}
      <form
        key={book.current_page}
        action={setProgress}
        className="flex h-12 items-center rounded-full border border-borde bg-tinta/40 pl-4 pr-0.5 focus-within:border-mostaza focus-within:ring-2 focus-within:ring-mostaza"
      >
        <input type="hidden" name="id" value={book.id} />
        <label className="flex min-w-0 flex-1 items-center gap-2 whitespace-nowrap text-[13px] text-crema-suave">
          Voy por la página
          <input
            name="page"
            aria-label="Página actual"
            type="number"
            inputMode="numeric"
            min={0}
            max={book.pages ?? 10000}
            defaultValue={book.current_page}
            required
            className="h-10 w-16 rounded-lg border-0 bg-transparent px-1 text-center font-display text-lg font-extrabold text-crema [appearance:textfield] focus-visible:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        </label>
        <button
          type="submit"
          aria-label="Guardar progreso"
          className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-mostaza text-tinta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crema"
        >
          <svg
            aria-hidden="true"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </button>
      </form>

      {finished && (
        <p className="text-[13px] font-bold text-mostaza">
          ¡Llegaste al final! Tocá “Lo terminé” para pasarlo a Leídos.
        </p>
      )}
    </div>
  );
}
