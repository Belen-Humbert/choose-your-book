"use client";

import Link from "next/link";
import { useState } from "react";
import { addBook } from "@/app/(app)/pila/actions";
import { GENRES } from "@/lib/genres";
import type { BookSuggestion } from "@/lib/googleBooks";
import BuscadorLibros from "./BuscadorLibros";
import SubirPortada from "./SubirPortada";

const fieldClass =
  "h-12 w-full rounded-xl border-0 bg-crema px-4 text-base text-tinta placeholder:text-tinta/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mostaza";

const labelClass = "flex flex-col gap-1.5 text-sm font-medium text-crema-suave";

export default function FormularioLibro() {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [genre, setGenre] = useState("");
  const [pages, setPages] = useState("");
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [googleBooksId, setGoogleBooksId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  function applySuggestion(suggestion: BookSuggestion) {
    setTitle(suggestion.title);
    setAuthor(suggestion.author ?? "");
    setGenre(suggestion.genre ?? "");
    setPages(suggestion.pages ? String(suggestion.pages) : "");
    setCoverUrl(suggestion.coverUrl);
    setGoogleBooksId(suggestion.googleBooksId);
  }

  function clearSuggestion() {
    setTitle("");
    setAuthor("");
    setGenre("");
    setPages("");
    setCoverUrl(null);
    setGoogleBooksId(null);
  }

  return (
    <div className="flex flex-col gap-5">
      <BuscadorLibros onSelect={applySuggestion} />

      <div className="flex items-center gap-3 text-sm text-crema-suave">
        <span className="h-px flex-1 bg-borde" />
        {googleBooksId ? "revisá los datos" : "o cargalo a mano"}
        <span className="h-px flex-1 bg-borde" />
      </div>

      <form action={addBook} className="flex flex-col gap-4">
        <input type="hidden" name="cover_url" value={coverUrl ?? ""} />
        <input type="hidden" name="google_books_id" value={googleBooksId ?? ""} />

        {googleBooksId && (
          <div className="flex items-center gap-3 rounded-xl border border-petroleo bg-petroleo/25 p-2.5">
            <p className="min-w-0 flex-1 text-sm text-crema">
              Libro elegido de la búsqueda. Podés corregir lo que quieras.
            </p>
            <button
              type="button"
              onClick={clearSuggestion}
              className="h-11 shrink-0 cursor-pointer rounded-full border-[1.5px] border-borde px-3 text-sm font-medium text-crema focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mostaza"
            >
              Quitar
            </button>
          </div>
        )}

        <SubirPortada
          coverUrl={coverUrl}
          onChange={setCoverUrl}
          onUploadingChange={setUploading}
        />

        <label className={labelClass}>
          Título
          <input
            name="title"
            type="text"
            required
            maxLength={200}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className={fieldClass}
          />
        </label>

        <label className={labelClass}>
          Autor
          <input
            name="author"
            type="text"
            maxLength={200}
            value={author}
            onChange={(event) => setAuthor(event.target.value)}
            className={fieldClass}
          />
        </label>

        <label className={labelClass}>
          Género
          <select
            name="genre"
            value={genre}
            onChange={(event) => setGenre(event.target.value)}
            className={fieldClass}
          >
            <option value="">Elegí un género</option>
            {GENRES.map((g) => (
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
            value={pages}
            onChange={(event) => setPages(event.target.value)}
            className={fieldClass}
          />
        </label>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-crema-suave">
            ¿Dónde lo tenés?
          </legend>
          <div className="flex gap-2">
            <label className="cursor-pointer">
              <input type="checkbox" name="digital" className="peer sr-only" />
              <span className="inline-flex h-11 items-center rounded-full border-[1.5px] border-borde px-4 text-sm font-medium text-crema peer-checked:border-petroleo peer-checked:bg-petroleo peer-checked:font-bold peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-mostaza">
                Digital
              </span>
            </label>
            <label className="cursor-pointer">
              <input type="checkbox" name="fisico" className="peer sr-only" />
              <span className="inline-flex h-11 items-center rounded-full border-[1.5px] border-borde px-4 text-sm font-medium text-crema peer-checked:border-mostaza peer-checked:bg-mostaza peer-checked:font-bold peer-checked:text-tinta peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-mostaza">
                Físico
              </span>
            </label>
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={uploading}
          className="mt-1 h-[60px] cursor-pointer rounded-2xl bg-mostaza text-lg font-bold text-tinta shadow-[0_4px_0_#9a6f10] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-crema disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading ? "Subiendo portada…" : "Agregar a mi pila"}
        </button>

        <Link
          href="/pila"
          className="text-center text-sm font-medium text-crema-suave underline"
        >
          Cancelar
        </Link>
      </form>
    </div>
  );
}
