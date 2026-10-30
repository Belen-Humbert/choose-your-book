import { deleteBook, setStatus } from "@/app/(app)/pila/actions";
import type { Book, BookStatus } from "@/lib/types";
import BookCover from "./BookCover";
import ProgresoLectura from "./ProgresoLectura";

// Qué botones de estado se ofrecen según dónde está el libro.
const STATUS_ACTIONS: Record<BookStatus, { label: string; to: BookStatus }[]> = {
  pendiente: [{ label: "Empezar a leer", to: "leyendo" }],
  leyendo: [
    { label: "Lo terminé", to: "leido" },
    { label: "Volver a la pila", to: "pendiente" },
  ],
  leido: [{ label: "Volver a la pila", to: "pendiente" }],
};

export default function BookRow({ book }: { book: Book }) {
  const meta = [book.genre, book.pages ? `${book.pages} págs` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="flex flex-col gap-3 rounded-[14px] border border-borde bg-panel p-2.5">
      <div className="flex items-start gap-3">
        <BookCover book={book} variant="row" />

        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="font-display text-[17px] font-extrabold leading-[1.1] text-crema">
            {book.title}
          </p>
          {book.author && (
            <p className="text-[13px] text-crema-suave">{book.author}</p>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {book.has_digital && (
              <span className="rounded-[10px] bg-petroleo px-2.5 py-0.5 text-xs font-bold text-crema">
                Digital
              </span>
            )}
            {book.has_physical && (
              <span className="rounded-[10px] bg-mostaza px-2.5 py-0.5 text-xs font-bold text-tinta">
                Físico
              </span>
            )}
            {meta && <span className="text-xs text-crema-suave">{meta}</span>}
          </div>
        </div>

        <form action={deleteBook}>
          <input type="hidden" name="id" value={book.id} />
          <button
            type="submit"
            aria-label={`Quitar ${book.title} de la pila`}
            className="flex size-11 cursor-pointer items-center justify-center rounded-full text-crema-suave focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mostaza"
          >
            <svg
              aria-hidden="true"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
            </svg>
          </button>
        </form>
      </div>

      {book.status === "leyendo" && <ProgresoLectura book={book} />}

      <div className="flex flex-wrap gap-2">
        {STATUS_ACTIONS[book.status].map((action) => (
          <form key={action.to} action={setStatus}>
            <input type="hidden" name="id" value={book.id} />
            <input type="hidden" name="status" value={action.to} />
            <button
              type="submit"
              className={`h-11 cursor-pointer rounded-full border-[1.5px] px-4 text-[13px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mostaza ${
                action.to === "pendiente"
                  ? "border-borde font-medium text-crema-suave"
                  : "border-mostaza bg-mostaza font-bold text-tinta"
              }`}
            >
              {action.label}
            </button>
          </form>
        ))}
      </div>
    </li>
  );
}
