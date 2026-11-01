"use client";

import { useState } from "react";
import { toggleFormat } from "@/app/(app)/pila/actions";
import type { Book } from "@/lib/types";

type Props = {
  book: Pick<Book, "id" | "title" | "status" | "has_digital" | "has_physical">;
  // En el detalle del libro se ofrece elegir el formato en cualquier estado.
  always?: boolean;
};

function IconoLibro() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 6.5C10 5 7 4.5 4 5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5zM12 6.5V19.5" />
    </svg>
  );
}

function IconoLector() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2.5" width="14" height="19" rx="2.2" />
      <path d="M8.5 8h7M8.5 11.5h7M8.5 15h4" />
    </svg>
  );
}

const base =
  "inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-full border-[1.5px] px-4 text-[13px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mostaza";

function Opcion({
  id,
  formato,
  activo,
  titulo,
}: {
  id: string;
  formato: "digital" | "fisico";
  activo: boolean;
  titulo: string;
}) {
  const digital = formato === "digital";
  const on = digital
    ? "border-petroleo bg-petroleo font-bold text-crema"
    : "border-mostaza bg-mostaza font-bold text-tinta";
  return (
    <form action={toggleFormat}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="formato" value={formato} />
      <button
        type="submit"
        aria-pressed={activo}
        aria-label={`${digital ? "Digital" : "Físico"}: ${titulo}`}
        className={`${base} ${activo ? on : "border-borde font-medium text-crema"}`}
      >
        {digital ? <IconoLector /> : <IconoLibro />}
        {digital ? "Digital" : "Físico"}
      </button>
    </form>
  );
}

// Formato del libro. Sin formato (y por leer): dos botones con ícono para elegir con un toque,
// se pueden marcar los dos. Con formato: la etiqueta de siempre; tocarla permite cambiarlo.
export default function FormatoLibro({ book, always = false }: Props) {
  const [editing, setEditing] = useState(false);
  const has = book.has_digital || book.has_physical;

  if (!has && !always && book.status !== "pendiente") return null;

  if (has && !editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label={`Cambiar el formato de ${book.title}`}
        className="flex min-h-11 cursor-pointer flex-wrap items-center gap-2 self-start rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mostaza"
      >
        {book.has_digital && (
          <span className="rounded-[10px] bg-petroleo px-2.5 py-0.5 text-xs font-bold text-crema">Digital</span>
        )}
        {book.has_physical && (
          <span className="rounded-[10px] bg-mostaza px-2.5 py-0.5 text-xs font-bold text-tinta">Físico</span>
        )}
      </button>
    );
  }

  return (
    <div role="group" aria-label="Formato" className="flex flex-wrap items-center gap-2">
      {!has && <span className="text-xs text-crema-suave">¿Cómo lo vas a leer?</span>}
      <Opcion id={book.id} formato="fisico" activo={book.has_physical} titulo={book.title} />
      <Opcion id={book.id} formato="digital" activo={book.has_digital} titulo={book.title} />
      {has && (
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="h-11 cursor-pointer px-3 text-[13px] font-bold text-mostaza underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mostaza"
        >
          Listo
        </button>
      )}
    </div>
  );
}
