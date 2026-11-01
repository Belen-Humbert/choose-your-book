import Link from "next/link";
import { addNote, deleteNote, updateNote } from "@/app/(app)/pila/actions";
import { NOTE_MAX_LENGTH } from "@/lib/notes";
import { bookPercent, notePosition, positionLabel } from "@/lib/progress";
import type { Book, BookNote, BookStatus } from "@/lib/types";
import BookCover from "./BookCover";
import { EstrellasEditables } from "./Estrellas";
import FechaHora from "./FechaHora";
import FormatoLibro from "./FormatoLibro";
import ProgresoLectura from "./ProgresoLectura";

const STATUS_LABEL: Record<BookStatus, string> = {
  pendiente: "Por leer",
  leyendo: "Leyendo",
  leido: "Leído",
  abandonado: "Abandonado",
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
  editingNoteId = null,
}: {
  book: Book;
  notes: BookNote[];
  notesFailed?: boolean;
  error?: string | null;
  editingNoteId?: string | null;
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
      <div className="-mx-5 -mt-6 flex flex-col gap-3 rounded-b-[28px] bg-petroleo px-5 pb-5 pt-3">
      <Link
        href={`/pila?estado=${book.status === "pendiente" ? "pendiente" : book.status}`}
        className="inline-flex min-h-11 items-center gap-1 self-start text-sm font-bold text-oro focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crema"
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
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-oro">
            {STATUS_LABEL[book.status]}
          </p>
          <h1 className="font-display text-3xl font-extrabold leading-[1.05] text-crema">
            {book.title}
          </h1>
          {book.author && (
            <p className="text-[15px] text-crema-suave">{book.author}</p>
          )}
          <FormatoLibro book={book} always onDark />
          <div className="flex flex-wrap items-center gap-2">
            {meta && <span className="text-xs text-crema-suave">{meta}</span>}
          </div>
          {book.status === "leido" && book.finished_at && (
            <p className="text-xs text-crema-suave">
              Terminado el <FechaHora iso={book.finished_at} soloFecha />
            </p>
          )}
          <Link
            href={`/pila/${book.id}/editar`}
            className="inline-flex min-h-11 items-center self-start text-sm font-bold text-oro underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crema"
          >
            Editar libro
          </Link>
        </div>
      </header>
      </div>

      {book.status === "leyendo" && (
        <section
          aria-label="Progreso"
          className="rounded-[14px] border border-borde bg-panel p-3.5"
        >
          <ProgresoLectura book={book} />
        </section>
      )}

      {book.status === "leido" && (
        <section
          aria-label="Mi calificación"
          className="flex flex-col gap-1 rounded-[14px] border border-borde bg-panel p-3.5"
        >
          <p className="text-sm font-medium text-suave">
            {book.rating ? "Tu calificación" : "¿Cuántas estrellas le pondrías?"}
          </p>
          <EstrellasEditables bookId={book.id} rating={book.rating ?? null} />
        </section>
      )}

      <section aria-labelledby="notas-titulo" className="flex flex-col gap-3">
        <h2
          id="notas-titulo"
          className="font-display text-2xl font-extrabold text-tinta"
        >
          Notas
          {notes.length > 0 && (
            <span className="ml-2 text-base font-bold text-suave">
              {notes.length}
            </span>
          )}
        </h2>

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-ladrillo bg-ladrillo/25 px-4 py-3 text-sm text-tinta"
          >
            {error}
          </p>
        )}

        {book.status === "leyendo" ? (
          <p className="text-sm text-suave">
            Para dejar una nota, tocá “Actualizar progreso” más arriba: queda
            guardada con la fecha, la hora y la página o el porcentaje en que
            ibas.
          </p>
        ) : (
          <form action={addNote} className="flex flex-col gap-2">
            <input type="hidden" name="book_id" value={book.id} />
            <label
              htmlFor="nota"
              className="text-sm font-medium text-suave"
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
              className="min-h-28 w-full resize-y rounded-xl border border-borde bg-crema p-3 text-base text-tinta placeholder:text-tinta/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-petroleo"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="min-w-0 flex-1 text-xs text-suave">
                Se guarda con la fecha y la hora
                {nowLabel ? ` y el punto en que vas (${nowLabel})` : ""}.
              </p>
              <button
                type="submit"
                className="h-12 cursor-pointer rounded-full bg-ladrillo px-6 text-base font-bold text-crema shadow-[0_3px_0_#6f2f18] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-tinta"
              >
                Guardar nota
              </button>
            </div>
          </form>
        )}

        {notesFailed ? (
          <p
            role="alert"
            className="rounded-xl border border-ladrillo bg-ladrillo/25 px-4 py-3 text-sm text-tinta"
          >
            No pudimos cargar las notas. Probá de nuevo en un rato.
          </p>
        ) : notes.length === 0 ? (
          <p className="rounded-[14px] border border-dashed border-borde p-4 text-sm text-suave">
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
                  <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-suave">
                    <FechaHora iso={note.created_at} />
                    <PosicionNota note={note} pages={book.pages} />
                  </div>
                  <div className="flex items-center">
                  {editingNoteId !== note.id && (
                    <Link
                      href={`/pila/${book.id}?editar=${note.id}`}
                      aria-label="Editar esta nota"
                      className="flex size-11 items-center justify-center rounded-full text-suave focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-petroleo"
                    >
                      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4zM13.5 6.5l4 4" />
                      </svg>
                    </Link>
                  )}
                  <form action={deleteNote}>
                    <input type="hidden" name="note_id" value={note.id} />
                    <input type="hidden" name="book_id" value={book.id} />
                    <button
                      type="submit"
                      aria-label="Borrar esta nota"
                      className="-mr-2 flex size-11 cursor-pointer items-center justify-center rounded-full text-suave focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-petroleo"
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
                </div>
                {editingNoteId === note.id ? (
                  <form action={updateNote} className="flex flex-col gap-2">
                    <input type="hidden" name="note_id" value={note.id} />
                    <input type="hidden" name="book_id" value={book.id} />
                    <label htmlFor={`editar-${note.id}`} className="sr-only">
                      Editar la nota
                    </label>
                    <textarea
                      id={`editar-${note.id}`}
                      name="body"
                      required
                      autoFocus
                      rows={4}
                      maxLength={NOTE_MAX_LENGTH}
                      defaultValue={note.body}
                      className="min-h-28 w-full resize-y rounded-xl border border-borde bg-crema p-3 text-base text-tinta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-petroleo"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/pila/${book.id}`}
                        className="inline-flex h-11 items-center px-4 text-sm font-medium text-suave underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-petroleo"
                      >
                        Cancelar
                      </Link>
                      <button
                        type="submit"
                        className="h-11 cursor-pointer rounded-full bg-ladrillo px-5 text-sm font-bold text-crema focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta"
                      >
                        Guardar cambios
                      </button>
                    </div>
                  </form>
                ) : (
                  <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-tinta">
                    {note.body}
                  </p>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}
