"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { updateProgress } from "@/app/(app)/pila/actions";
import { NOTE_MAX_LENGTH } from "@/lib/notes";
import { bookPercent, pageFromPercent, progressPercent } from "@/lib/progress";
import type { Book } from "@/lib/types";

type Mode = "pagina" | "porcentaje";

type BookProgress = Pick<
  Book,
  | "id"
  | "pages"
  | "current_page"
  | "current_percent"
  | "has_digital"
  | "has_physical"
>;

function Enviar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-11 cursor-pointer rounded-full bg-tinta px-5 text-sm font-bold text-crema focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-petroleo disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? "Guardando…" : "Actualizar progreso"}
    </button>
  );
}

const modeButton =
  "flex h-11 min-w-12 cursor-pointer items-center justify-center px-3 text-base font-bold focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-petroleo";

// Panel para anotar dónde vas, como en Goodreads: "Voy por [página] de [total]", con un selector
// para medir en página (#) o en porcentaje (%), y una nota opcional que queda guardada con
// esa posición.
export default function ActualizarProgreso({ book }: { book: BookProgress }) {
  const total = book.pages;
  const percentNow = bookPercent(book);

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("pagina");
  const [value, setValue] = useState("");
  const [body, setBody] = useState("");

  const triggerRef = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);
  const valueId = useId();
  const noteId = useId();
  const counterId = useId();

  // Al cerrar el panel, el foco vuelve al botón que lo abrió.
  useEffect(() => {
    if (!open && restoreFocus.current) {
      restoreFocus.current = false;
      triggerRef.current?.focus();
    }
  }, [open]);

  function openPanel() {
    // Los libros digitales muestran el avance en %, así que arrancamos por ahí. Si no se sabe
    // el total de páginas y ya hay un % anotado, también.
    const startMode: Mode =
      (book.has_digital && !book.has_physical) || (!total && percentNow !== null)
        ? "porcentaje"
        : "pagina";
    setMode(startMode);
    setValue(
      String(startMode === "pagina" ? book.current_page : (percentNow ?? 0)),
    );
    setBody("");
    setOpen(true);
  }

  function closePanel() {
    restoreFocus.current = true;
    setOpen(false);
  }

  function switchMode(next: Mode) {
    if (next === mode) return;
    const typed = Number.parseInt(value, 10);
    let nextValue: number;
    if (total && Number.isFinite(typed) && typed >= 0) {
      // Pasamos lo que ya escribió al otro modo para no hacerle empezar de cero.
      nextValue =
        next === "porcentaje"
          ? (progressPercent(typed, total) ?? 0)
          : pageFromPercent(typed, total);
    } else {
      nextValue = next === "porcentaje" ? (percentNow ?? 0) : book.current_page;
    }
    setMode(next);
    setValue(String(nextValue));
  }

  if (!open) {
    return (
      <button
        ref={triggerRef}
        type="button"
        onClick={openPanel}
        className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full border-[1.5px] border-mostaza text-[15px] font-bold text-mostaza focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mostaza"
      >
        <svg
          aria-hidden="true"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4zM13.5 6.5l4 4" />
        </svg>
        Actualizar progreso
      </button>
    );
  }

  const typed = Number.parseInt(value, 10);
  const valid = Number.isFinite(typed) && typed >= 0;
  const max = mode === "pagina" ? (total ?? 10000) : 100;

  let hint = "";
  if (valid && total) {
    hint =
      mode === "pagina"
        ? `Equivale al ${progressPercent(Math.min(typed, total), total)}%`
        : `Equivale a la página ${pageFromPercent(typed, total)} de ${total}`;
  } else if (!total && mode === "pagina") {
    hint = "Sin el total de páginas del libro no se puede calcular el %.";
  }

  return (
    <form
      action={async (formData) => {
        await updateProgress(formData);
        closePanel();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") closePanel();
      }}
      aria-label="Actualizar progreso"
      className="flex flex-col gap-3 rounded-2xl bg-crema p-3.5 text-tinta"
    >
      <input type="hidden" name="id" value={book.id} />
      <input type="hidden" name="mode" value={mode} />

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <label htmlFor={valueId} className="text-sm font-medium">
            {mode === "pagina" ? "Voy por la página" : "Voy por el"}
          </label>
          <input
            id={valueId}
            name="value"
            type="number"
            inputMode="numeric"
            min={0}
            max={max}
            required
            autoFocus
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onFocus={(event) => event.target.select()}
            className="h-11 w-20 rounded-lg border border-tinta/30 bg-white/70 px-2 text-center font-display text-lg font-extrabold text-tinta [appearance:textfield] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-petroleo [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <span className="text-sm font-medium">
            {mode === "pagina" ? (total ? `de ${total}` : "") : "%"}
          </span>
        </div>

        <div
          role="group"
          aria-label="Medir el avance en"
          className="flex overflow-hidden rounded-full border border-tinta/30"
        >
          <button
            type="button"
            aria-pressed={mode === "porcentaje"}
            aria-label="Porcentaje"
            onClick={() => switchMode("porcentaje")}
            className={`${modeButton} ${
              mode === "porcentaje" ? "bg-tinta text-crema" : "text-tinta"
            }`}
          >
            %
          </button>
          <button
            type="button"
            aria-pressed={mode === "pagina"}
            aria-label="Número de página"
            onClick={() => switchMode("pagina")}
            className={`${modeButton} ${
              mode === "pagina" ? "bg-tinta text-crema" : "text-tinta"
            }`}
          >
            #
          </button>
        </div>
      </div>

      <p aria-live="polite" className="-mt-1 min-h-4 text-xs text-tinta/70">
        {hint}
      </p>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={noteId} className="sr-only">
          Nota (opcional)
        </label>
        <textarea
          id={noteId}
          name="body"
          rows={4}
          value={body}
          maxLength={NOTE_MAX_LENGTH}
          onChange={(event) => setBody(event.target.value)}
          aria-describedby={counterId}
          placeholder="Escribí una nota sobre lo que estás leyendo (opcional)"
          className="min-h-28 w-full resize-y rounded-xl border border-tinta/30 bg-white/70 p-3 text-base text-tinta placeholder:text-tinta/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-petroleo"
        />
        <p id={counterId} className="text-xs text-tinta/70">
          {NOTE_MAX_LENGTH - body.length} caracteres restantes
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={closePanel}
          className="h-11 cursor-pointer rounded-full px-4 text-sm font-medium text-tinta underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-petroleo"
        >
          Cancelar
        </button>
        <Enviar />
      </div>
    </form>
  );
}
