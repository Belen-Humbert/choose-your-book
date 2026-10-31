import Link from "next/link";
import { addNote, deleteNote } from "@/app/(app)/pila/actions";
import { NOTE_MAX_LENGTH } from "@/lib/notes";
import { bookPercent, notePosition, positionLabel } from "@/lib/progress";
import type { Book, BookNote, BookStatus } from "@/lib/types";
import BookCover from "./BookCover";
import FechaHora from "./FechaHora";
import ProgresoLectura from "./ProgresoLectura";

const STATUS_LABEL: Record<BookStatus, string> = {
  pendiente: "Por leer",
  leyendo: "Leyendo",
  leido: "Leído",
};

// Dónde ibas cuando escribiste la nota: "Página 225 · 54%", "Página 80" o "54%".
function PosicionNota({
  note,
  pages,
}: {
  note: BookNote;
  pages: number | null;
}) {
  const label = positionLabel(notePosition(note, pages));
  if (!label) return null;
  return (
    <span className="rounded-[10px] bg-petroleo px-2.5 py-0.5 font-bold text-crema">
      {label}
    </span>
  );
}

export default function DetalleLibro({
  book,
  notes,
  notesFailed = false,
  error = null,
}: {
  book: Book;
  notes: BookNote[];
  notesFailed?: boolean;
  error?: string | null;
}) {
  const meta = [book.genre, book.pages ? `${book.pages} págs` : null]
    .filter(Boolean)
    .join(" · ");

  const percentNow = bookPercent(book);
  const nowLabel = positionLabel({
    page: book.current_page > 0 ? book.current_page : null,
    percent: percentNow !== null && percentNow > 0 ? percentNow : null,
  });

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-5 py-6">
      <Link
        href={`/pila?estado=${book.status === "pendiente" ? "pendiente" : book.status}`}
        className="inline-flex min-h-11 items-center gap-1 self-start text-sm font-bold text-mostaza focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mostaza"
      >
        <svg
          aria-hidden="true"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 5l-7 7 7 7" />
        </svg>
        Mi pila
      </Link>

      <header className="flex gap-4">
        <BookCover book={book} variant="winner" />
        <div className="flex min-w-0 flex-col justify-center gap-1.5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-mostaza">
            {STATUS_LABEL[book.status]}
          </p>
          <h1 className="font-display text-3xl font-extrabold leading-[1.05] text-crema">
            {book.title}
          </h1>
          {book.author && (
            <p className="text-[15px] text-crema-suave">{book.author}</p>
          )}
          <div className="flex flex-wrap items-center gap-2">
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
      </header>

      {book.status === "leyendo" && (
        <section
          aria-label="Progreso"
          className="rounded-[14px] border border-borde bg-panel p-3.5"
        >
          <ProgresoLectura book={book} />
        </section>
      )}

      <section aria-labelledby="notas-titulo" className="flex flex-col gap-3">
        <h2
          id="notas-titulo"
          className="font-display text-2xl font-extrabold text-crema"
        >
          Notas
          {notes.length > 0 && (
            <span className="ml-2 text-base font-bold text-crema-suave">
              {notes.length}
            </span>
          )}
        </h2>

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-ladrillo bg-ladrillo/25 px-4 py-3 text-sm text-crema"
          >
            {error}
          </p>
        )}

        {book.status === "leyendo" ? (
          <p className="text-sm text-crema-suave">
            Para dejar una nota, tocá “Actualizar progreso” más arriba: queda
            guardada con la fecha, la hora y la página o el porcentaje en que
            ibas.
          </p>
        ) : (
          <form action={addNote} className="flex flex-col gap-2">
            <input type="hidden" name="book_id" value={book.id} />
            <label
              htmlFor="nota"
              className="text-sm font-medium text-crema-suave"
            >
              Nueva nota
            </label>
            <textarea
              id="nota"
              name="body"
              required
              maxLength={NOTE_MAX_LENGTH}
              rows={4}
              placeholder="¿Qué te pareció? Una frase, una duda, una cita…"
              className="min-h-28 w-full resize-y rounded-xl border-0 bg-crema p-3 text-base text-tinta placeholder:text-tinta/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mostaza"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="min-w-0 flex-1 text-xs text-crema-suave">
                Se guarda con la fecha y la hora
                {nowLabel ? ` y el punto en que vas (${nowLabel})` : ""}.
              </p>
              <button
                type="submit"
                className="h-12 cursor-pointer rounded-full bg-mostaza px-6 text-base font-bold text-tinta shadow-[0_3px_0_#9a6f10] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-crema"
              >
                Guardar nota
              </button>
            </div>
          </form>
        )}

        {notesFailed ? (
          <p
            role="alert"
            className="rounded-xl border border-ladrillo bg-ladrillo/25 px-4 py-3 text-sm text-crema"
          >
            No pudimos cargar las notas. Probá de nuevo en un rato.
          </p>
        ) : notes.length === 0 ? (
          <p className="rounded-[14px] border border-dashed border-borde p-4 text-sm text-crema-suave">
            Todavía no escribiste notas. Anotá lo que te va pasando mientras
            leés y queda guardado acá.
          </p>
        ) : (
          <ol className="flex flex-col gap-2.5">
            {notes.map((note) => (
              <li
                key={note.id}
                className="flex flex-col gap-2 rounded-[14px] border border-borde bg-panel p-3.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-crema-suave">
                    <FechaHora iso={note.created_at} />
                    <PosicionNota note={note} pages={book.pages} />
                  </div>
                  <form action={deleteNote}>
                    <input type="hidden" name="note_id" value={note.id} />
                    <input type="hidden" name="book_id" value={book.id} />
                    <button
                      type="submit"
                      aria-label="Borrar esta nota"
                      className="-mr-2 flex size-11 cursor-pointer items-center justify-center rounded-full text-crema-suave focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mostaza"
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
                <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-crema">
                  {note.body}
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}
