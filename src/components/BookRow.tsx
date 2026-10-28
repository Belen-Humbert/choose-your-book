import { deleteBook } from "@/app/(app)/pila/actions";
import { coverColors } from "@/lib/covers";
import type { Book } from "@/lib/types";

export default function BookRow({ book }: { book: Book }) {
  const colors = coverColors(book.id);
  const meta = [book.genre, book.pages ? `${book.pages} págs` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="flex items-center gap-3 rounded-[14px] border border-borde bg-panel py-2.5 pl-2.5 pr-1.5">
      <div
        aria-hidden="true"
        className="flex h-[76px] w-[52px] shrink-0 items-end rounded-l-[3px] rounded-r-md p-1.5 shadow-[inset_3px_0_0_rgba(0,0,0,0.25)]"
        style={{ backgroundColor: colors.bg, color: colors.ink }}
      >
        <span className="line-clamp-4 font-display text-[8px] font-extrabold uppercase leading-[1.05]">
          {book.title}
        </span>
      </div>

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
    </li>
  );
}
