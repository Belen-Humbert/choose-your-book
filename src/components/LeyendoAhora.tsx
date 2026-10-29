import Link from "next/link";
import type { Book } from "@/lib/types";
import BookCover from "./BookCover";

// Atajo en el inicio para no perder de vista lo que estás leyendo.
export default function LeyendoAhora({ books }: { books: Book[] }) {
  if (books.length === 0) return null;

  return (
    <section
      aria-label="Leyendo ahora"
      className="flex flex-col gap-2.5 rounded-[18px] border border-petroleo bg-petroleo/25 p-3.5"
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-widest text-crema-suave">
          Leyendo ahora
        </p>
        <Link
          href="/pila?estado=leyendo"
          className="inline-flex min-h-11 items-center text-sm font-bold text-mostaza underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mostaza"
        >
          Ver todo
        </Link>
      </div>
      <ul className="flex flex-col gap-2.5">
        {books.slice(0, 3).map((book) => (
          <li key={book.id} className="flex items-center gap-3">
            <BookCover book={book} variant="row" />
            <div className="min-w-0">
              <p className="font-display text-base font-extrabold leading-tight text-crema">
                {book.title}
              </p>
              {book.author && (
                <p className="text-[13px] text-crema-suave">{book.author}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
      {books.length > 3 && (
        <p className="text-xs text-crema-suave">y {books.length - 3} más</p>
      )}
    </section>
  );
}
