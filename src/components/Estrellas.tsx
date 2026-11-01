import { setRating } from "@/app/(app)/pila/actions";

function Estrella({ llena, size }: { llena: boolean; size: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={llena ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    >
      <path d="M12 3.2l2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 17l-5.4 3 1.1-6.1L3.2 9.6l6.1-.8L12 3.2z" />
    </svg>
  );
}

// Estrellas de solo lectura (para las tarjetas de Mi pila).
export function EstrellasLectura({ rating }: { rating: number | null }) {
  if (!rating) return null;
  return (
    <span
      role="img"
      aria-label={`${rating} de 5 estrellas`}
      className="inline-flex items-center gap-0.5 text-estrella"
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Estrella key={n} llena={n <= rating} size={14} />
      ))}
    </span>
  );
}

// Estrellas para calificar un libro leído. Tocar la estrella que ya está marcada la quita.
export function EstrellasEditables({
  bookId,
  rating,
}: {
  bookId: string;
  rating: number | null;
}) {
  return (
    <form action={setRating} className="flex items-center gap-0.5">
      <input type="hidden" name="id" value={bookId} />
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="submit"
          name="rating"
          value={rating === n ? 0 : n}
          aria-label={rating === n ? `Quitar la calificación de ${n} estrellas` : `${n} ${n === 1 ? "estrella" : "estrellas"}`}
          aria-pressed={rating === n}
          className="flex size-11 cursor-pointer items-center justify-center rounded-full text-estrella focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-petroleo"
        >
          <Estrella llena={rating !== null && n <= rating} size={28} />
        </button>
      ))}
    </form>
  );
}
