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
      className="h-2.5 w-full overflow-hidden rounded-full bg-borde"
    >
      <div
        className="h-full rounded-full bg-mostaza transition-[width] duration-300 motion-reduce:transition-none"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

// Progreso de un libro que estás leyendo.
// compact: solo la barra y el porcentaje (para el inicio). Completo: con el formulario para actualizar la página.
export default function ProgresoLectura({
  book,
  compact = false,
}: {
  book: Book;
  compact?: boolean;
}) {
  const percent = progressPercent(book.current_page, book.pages);
  const summary = book.pages
    ? `Página ${book.current_page} de ${book.pages}${percent !== null ? ` · ${percent}%` : ""}`
    : book.current_page > 0
      ? `Vas por la página ${book.current_page}`
      : "Todavía no empezaste";

  if (compact) {
    return (
      <div className="mt-1.5 flex flex-col gap-1">
        {percent !== null && (
          <Barra percent={percent} label={`Progreso de ${book.title}`} />
        )}
        <p className="text-xs text-crema-suave">{summary}</p>
      </div>
    );
  }

  const finished = book.pages !== null && book.current_page >= book.pages;

  return (
    <div className="mt-2 flex flex-col gap-2">
      {percent !== null && (
        <Barra percent={percent} label={`Progreso de ${book.title}`} />
      )}
      <p aria-live="polite" className="text-[13px] text-crema-suave">
        {summary}
      </p>

      {/* key: al guardar, el campo toma el valor nuevo que viene del servidor */}
      <form
        key={book.current_page}
        action={setProgress}
        className="flex flex-wrap items-end gap-2"
      >
        <input type="hidden" name="id" value={book.id} />
        <label className="flex flex-col gap-1 text-xs font-medium text-crema-suave">
          Página actual
          <input
            name="page"
            type="number"
            inputMode="numeric"
            min={0}
            max={book.pages ?? 10000}
            defaultValue={book.current_page}
            required
            className="h-11 w-28 rounded-xl border-0 bg-crema px-3 text-base text-tinta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mostaza"
          />
        </label>
        <button
          type="submit"
          className="h-11 cursor-pointer rounded-full border-[1.5px] border-mostaza px-4 text-[13px] font-bold text-mostaza focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mostaza"
        >
          Guardar progreso
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
