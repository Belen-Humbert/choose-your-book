"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { updateBook } from "@/app/(app)/pila/actions";
import { GENRES } from "@/lib/genres";
import type { Book } from "@/lib/types";
import SubirPortada from "./SubirPortada";

const fieldClass =
  "h-12 w-full rounded-xl border border-borde bg-crema px-4 text-base text-tinta placeholder:text-tinta/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-petroleo";
const labelClass = "flex flex-col gap-1.5 text-sm font-medium text-suave";
const pill =
  "inline-flex h-11 items-center rounded-full border-[1.5px] border-borde px-4 text-sm font-medium text-tinta";

const subscribe = () => () => {};

// "2026-10-30" en la zona horaria de quien mira (el servidor no la conoce).
function localDate(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function EditarLibro({ book }: { book: Book }) {
  const [coverUrl, setCoverUrl] = useState<string | null>(book.cover_url);
  const [uploading, setUploading] = useState(false);

  const finishedOn = useSyncExternalStore(
    subscribe,
    () => (book.finished_at ? localDate(book.finished_at) : ""),
    () => "",
  );
  // Un género que no está en la lista (viene de una importación) igual se conserva.
  const genres: string[] = [...GENRES];
  if (book.genre && !genres.includes(book.genre)) genres.push(book.genre);

  return (
    <form action={updateBook} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={book.id} />
      <input type="hidden" name="cover_url" value={coverUrl ?? ""} />

      <SubirPortada
        coverUrl={coverUrl}
        onChange={setCoverUrl}
        onUploadingChange={setUploading}
        savedUrl={book.cover_url}
      />

      <label className={labelClass}>
        Título
        <input name="title" type="text" required maxLength={200} defaultValue={book.title} className={fieldClass} />
      </label>
      <label className={labelClass}>
        Autor
        <input name="author" type="text" maxLength={200} defaultValue={book.author ?? ""} className={fieldClass} />
      </label>
      <label className={labelClass}>
        Género
        <select name="genre" defaultValue={book.genre ?? ""} className={fieldClass}>
          <option value="">Sin género</option>
          {genres.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </label>
      <label className={labelClass}>
        Páginas
        <input
          name="pages"
          type="number"
          inputMode="numeric"
          min={1}
          max={10000}
          defaultValue={book.pages ?? ""}
          className={fieldClass}
        />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-suave">Formato</legend>
        <div className="flex gap-2">
          <label className="cursor-pointer">
            <input type="checkbox" name="digital" defaultChecked={book.has_digital} className="peer sr-only" />
            <span className={`${pill} peer-checked:border-petroleo peer-checked:bg-petroleo peer-checked:font-bold peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-petroleo`}>
              Digital
            </span>
          </label>
          <label className="cursor-pointer">
            <input type="checkbox" name="fisico" defaultChecked={book.has_physical} className="peer sr-only" />
            <span className={`${pill} peer-checked:border-mostaza peer-checked:bg-mostaza peer-checked:font-bold peer-checked:text-tinta peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-petroleo`}>
              Físico
            </span>
          </label>
        </div>
      </fieldset>

      {book.status === "leido" && (
        <label className={labelClass}>
          Lo terminé el
          <input
            key={finishedOn}
            name="finished_on"
            type="date"
            defaultValue={finishedOn}
            className={fieldClass}
          />
        </label>
      )}

      <button
        type="submit"
        disabled={uploading}
        className="mt-1 h-[60px] cursor-pointer rounded-2xl bg-ladrillo text-lg font-bold text-crema shadow-[0_4px_0_#6f2f18] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-tinta disabled:cursor-not-allowed disabled:opacity-60"
      >
        {uploading ? "Subiendo portada…" : "Guardar cambios"}
      </button>
      <Link href={`/pila/${book.id}`} className="text-center text-sm font-medium text-suave underline">
        Cancelar
      </Link>
    </form>
  );
}
