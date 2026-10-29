"use client";

import Image from "next/image";
import { useEffect, useId, useState } from "react";
import type { BookSuggestion } from "@/lib/googleBooks";

type Status = "idle" | "loading" | "done" | "error";

export default function BuscadorLibros({
  onSelect,
}: {
  onSelect: (suggestion: BookSuggestion) => void;
}) {
  const inputId = useId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BookSuggestion[]>([]);
  const [status, setStatus] = useState<Status>("idle");

  const term = query.trim();
  const active = term.length >= 2;

  useEffect(() => {
    if (term.length < 2) return;

    const controller = new AbortController();
    // Esperamos a que termine de escribir para no buscar en cada tecla.
    const timer = window.setTimeout(async () => {
      setStatus("loading");
      try {
        const response = await fetch(
          `/api/libros/buscar?q=${encodeURIComponent(term)}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error("falló la búsqueda");
        const data = (await response.json()) as { results: BookSuggestion[] };
        setResults(data.results);
        setStatus("done");
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        setResults([]);
        setStatus("error");
      }
    }, 400);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [term]);

  function choose(suggestion: BookSuggestion) {
    onSelect(suggestion);
    setQuery("");
    setResults([]);
    setStatus("idle");
  }

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={inputId}
        className="text-sm font-medium text-crema-suave"
      >
        Buscá tu libro
      </label>
      <div className="relative">
        <svg
          aria-hidden="true"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#5a4636"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="absolute left-3.5 top-3.5"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
        <input
          id={inputId}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Título, autor o ISBN"
          autoComplete="off"
          maxLength={100}
          className="h-12 w-full rounded-xl border-0 bg-crema pl-11 pr-4 text-base text-tinta placeholder:text-tinta/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mostaza"
        />
      </div>

      <p aria-live="polite" className="text-xs text-crema-suave">
        {!active && "Elegí un resultado y se completan portada, páginas y género."}
        {active && status === "loading" && "Buscando…"}
        {active && status === "error" &&
          "No pudimos buscar ahora. Podés cargar el libro a mano acá abajo."}
        {active && status === "done" && results.length === 0 &&
          "No encontramos nada. Probá con otro título o cargalo a mano."}
      </p>

      {active && results.length > 0 && (
        <ul className="flex max-h-[360px] flex-col gap-2 overflow-y-auto">
          {results.map((result) => (
            <li key={result.googleBooksId}>
              <button
                type="button"
                onClick={() => choose(result)}
                className="flex min-h-[72px] w-full cursor-pointer items-center gap-3 rounded-xl border border-borde bg-panel p-2 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mostaza"
              >
                {result.coverUrl ? (
                  <Image
                    src={result.coverUrl}
                    alt=""
                    width={40}
                    height={58}
                    unoptimized
                    className="h-[58px] w-10 shrink-0 rounded-sm object-cover"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="h-[58px] w-10 shrink-0 rounded-sm bg-borde"
                  />
                )}
                <span className="flex min-w-0 flex-col">
                  <span className="font-display text-base font-extrabold leading-tight text-crema">
                    {result.title}
                  </span>
                  {result.author && (
                    <span className="text-[13px] text-crema-suave">
                      {result.author}
                    </span>
                  )}
                  <span className="text-xs text-crema-suave">
                    {[result.genre, result.pages ? `${result.pages} págs` : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
