import { bookPercent, progressSummary } from "@/lib/progress";
import type { Book } from "@/lib/types";
import ActualizarProgreso from "./ActualizarProgreso";

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
// compact: solo la barra y un resumen (para el inicio). Completo: con el panel para actualizar
// el avance (por página o por porcentaje) y dejar una nota.
export default function ProgresoLectura({
  book,
  compact = false,
}: {
  book: Book;
  compact?: boolean;
}) {
  const percent = bookPercent(book);
  const summary = progressSummary(book);

  if (compact) {
    return (
      <div className="mt-1.5 flex flex-col gap-1.5">
        {percent !== null && (
          <Barra percent={percent} label={`Progreso de ${book.title}`} />
        )}
        <p className="text-xs text-crema-suave">
          {summary}
          {percent !== null && book.pages ? ` · ${percent}%` : ""}
        </p>
      </div>
    );
  }

  const finished = percent !== null && percent >= 100;

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

      <ActualizarProgreso book={book} />

      {finished && (
        <p className="text-[13px] font-bold text-mostaza">
          ¡Llegaste al final! Tocá “Lo terminé” para pasarlo a Leídos.
        </p>
      )}
    </div>
  );
}
