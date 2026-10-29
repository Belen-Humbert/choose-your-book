"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { setStatus } from "@/app/(app)/pila/actions";
import { coverColors } from "@/lib/covers";
import type { Book } from "@/lib/types";
import BookCover from "./BookCover";

type Formato = "todos" | "digital" | "fisico";

const PAGES_MIN = 100;
const PAGES_MAX = 800; // en el tope no hay límite de páginas
const MAX_SPINES = 8;
const SPINE_HEIGHTS = [72, 84, 60, 78, 66, 88, 70, 62];
const SPINE_ROTATIONS = [1, -1, 2, -2, 1, -1, 2, -1];

const chipBase =
  "inline-flex h-11 shrink-0 cursor-pointer items-center rounded-full border-[1.5px] px-4 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mostaza";
const chipOff = "border-borde font-medium text-crema";
const chipOnTeal = "border-petroleo bg-petroleo font-bold text-crema";
const chipOnRed = "border-ladrillo bg-ladrillo font-bold text-crema";

const sectionLabel =
  "text-xs font-bold uppercase tracking-widest text-crema-suave";

// Qué lomos dibujar en la pila: hasta MAX_SPINES, y siempre incluye al elegido.
function pickShown(matches: Book[], winnerId: string | null) {
  if (matches.length <= MAX_SPINES) return matches;
  const first = matches.slice(0, MAX_SPINES);
  if (!winnerId || first.some((book) => book.id === winnerId)) return first;
  const winner = matches.find((book) => book.id === winnerId);
  return winner ? [...first.slice(0, MAX_SPINES - 1), winner] : first;
}

export default function Ruleta({ books }: { books: Book[] }) {
  const [formato, setFormato] = useState<Formato>("todos");
  const [genre, setGenre] = useState<string | null>(null);
  const [maxPages, setMaxPages] = useState(PAGES_MAX);

  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const timers = useRef<number[]>([]);
  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }, []);
  useEffect(() => clearTimers, [clearTimers]);

  const genres = useMemo(
    () =>
      Array.from(
        new Set(books.map((book) => book.genre).filter((g): g is string => !!g)),
      ).sort((a, b) => a.localeCompare(b, "es")),
    [books],
  );

  const matches = useMemo(
    () =>
      books.filter((book) => {
        if (formato === "digital" && !book.has_digital) return false;
        if (formato === "fisico" && !book.has_physical) return false;
        if (genre && book.genre !== genre) return false;
        if (maxPages < PAGES_MAX && (book.pages === null || book.pages > maxPages))
          return false;
        return true;
      }),
    [books, formato, genre, maxPages],
  );

  const winner = revealed ? matches.find((book) => book.id === winnerId) : undefined;
  const shown = pickShown(matches, winnerId);

  // Cada cambio de filtro descarta el sorteo anterior.
  function resetSpin() {
    clearTimers();
    setWinnerId(null);
    setHighlightId(null);
    setSpinning(false);
    setRevealed(false);
  }

  function spin() {
    if (matches.length === 0 || spinning) return;
    clearTimers();

    const pool =
      matches.length > 1 && winnerId
        ? matches.filter((book) => book.id !== winnerId)
        : matches;
    const chosen = pool[Math.floor(Math.random() * pool.length)];

    setWinnerId(chosen.id);
    setRevealed(false);

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion || matches.length === 1) {
      setHighlightId(chosen.id);
      setRevealed(true);
      return;
    }

    setSpinning(true);
    const list = pickShown(matches, chosen.id);
    const steps = 14;
    const start = Math.floor(Math.random() * list.length);
    let delay = 0;
    for (let i = 0; i < steps; i++) {
      delay += 60 + i * 12;
      const id =
        i === steps - 1 ? chosen.id : list[(start + i) % list.length].id;
      timers.current.push(window.setTimeout(() => setHighlightId(id), delay));
    }
    timers.current.push(
      window.setTimeout(() => {
        setSpinning(false);
        setRevealed(true);
      }, delay + 150),
    );
  }

  if (books.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-[14px] border border-borde bg-panel p-5">
        <p className="font-display text-2xl font-extrabold text-crema">
          Tu pila está vacía
        </p>
        <p className="text-sm text-crema-suave">
          Sumá algunos libros y la ruleta elige por vos.
        </p>
        <Link
          href="/pila/nueva"
          className="inline-flex h-12 items-center rounded-2xl bg-mostaza px-5 text-base font-bold text-tinta shadow-[0_4px_0_#9a6f10] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-crema"
        >
          Agregar un libro
        </Link>
      </div>
    );
  }

  const winnerMeta = winner
    ? [winner.genre, winner.pages ? `${winner.pages} págs` : null]
        .filter(Boolean)
        .join(" · ")
    : "";

  return (
    <div className="flex flex-col gap-4">
      <section
        aria-label="Filtros"
        className="flex flex-col gap-3.5 rounded-[18px] border border-borde bg-panel p-4"
      >
        <div className="flex flex-col gap-2">
          <p className={sectionLabel}>Formato</p>
          <div className="flex gap-2">
            {(
              [
                ["todos", "Todos"],
                ["digital", "Digital"],
                ["fisico", "Físico"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={formato === value}
                onClick={() => {
                  setFormato(value);
                  resetSpin();
                }}
                className={`${chipBase} ${formato === value ? chipOnTeal : chipOff}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {genres.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className={sectionLabel}>Género</p>
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
              <button
                type="button"
                aria-pressed={genre === null}
                onClick={() => {
                  setGenre(null);
                  resetSpin();
                }}
                className={`${chipBase} ${genre === null ? chipOnRed : chipOff}`}
              >
                Todos
              </button>
              {genres.map((g) => (
                <button
                  key={g}
                  type="button"
                  aria-pressed={genre === g}
                  onClick={() => {
                    setGenre(g);
                    resetSpin();
                  }}
                  className={`${chipBase} ${genre === g ? chipOnRed : chipOff}`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <label htmlFor="max-pages" className={sectionLabel}>
              Páginas
            </label>
            <span className="text-sm font-bold text-mostaza">
              {maxPages >= PAGES_MAX ? "sin límite" : `hasta ${maxPages}`}
            </span>
          </div>
          <input
            id="max-pages"
            type="range"
            min={PAGES_MIN}
            max={PAGES_MAX}
            step={50}
            value={maxPages}
            onChange={(event) => {
              setMaxPages(Number(event.target.value));
              resetSpin();
            }}
            className="h-6 w-full cursor-pointer accent-mostaza"
          />
          <div className="flex justify-between text-xs text-crema-suave">
            <span>{PAGES_MIN}</span>
            <span>{PAGES_MAX}+</span>
          </div>
        </div>
      </section>

      <div className="flex h-[92px] items-end gap-4 px-1">
        <div aria-hidden="true" className="flex h-[92px] items-end gap-1.5">
          {shown.map((book, index) => {
            const colors = coverColors(book.id);
            const lifted = book.id === highlightId;
            return (
              <div
                key={book.id}
                className="w-9 rounded-[3px] pt-2.5 transition-transform duration-300 motion-reduce:transition-none"
                style={{
                  height: SPINE_HEIGHTS[index % SPINE_HEIGHTS.length],
                  backgroundColor: colors.bg,
                  transform: lifted
                    ? "translateY(-10px) rotate(-4deg)"
                    : `rotate(${SPINE_ROTATIONS[index % SPINE_ROTATIONS.length]}deg)`,
                  boxShadow: lifted ? "0 8px 14px rgba(0,0,0,0.45)" : "none",
                }}
              >
                <div
                  className="h-1 opacity-85"
                  style={{ backgroundColor: colors.ink }}
                />
              </div>
            );
          })}
        </div>
        <div className="pb-1">
          <p className="font-display text-2xl font-extrabold leading-[1.1] text-crema">
            {matches.length} {matches.length === 1 ? "libro" : "libros"}
          </p>
          <p className="text-sm text-crema-suave">
            {matches.length === 1 ? "cumple" : "cumplen"} tus filtros
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={spin}
        disabled={matches.length === 0 || spinning}
        className="flex h-[60px] cursor-pointer items-center justify-center gap-2.5 rounded-2xl bg-mostaza text-lg font-bold text-tinta shadow-[0_4px_0_#9a6f10] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-crema disabled:cursor-not-allowed disabled:opacity-50"
      >
        <svg
          aria-hidden="true"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12a9 9 0 1 1-3-6.7" />
          <path d="M21 4v5h-5" />
        </svg>
        {spinning ? "Girando…" : revealed ? "Girar de nuevo" : "Girar la pila"}
      </button>

      <div aria-live="polite">
        {winner ? (
          <section className="flex gap-3.5 rounded-[18px] bg-crema p-3.5 text-tinta">
            <BookCover book={winner} variant="winner" />
            <div className="flex min-w-0 flex-col justify-center gap-1.5">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a3a1c]">
                Te toca
              </p>
              <p className="font-display text-2xl font-extrabold leading-[1.05]">
                {winner.title}
              </p>
              {winner.author && <p className="text-sm">{winner.author}</p>}
              <p className="text-[13px] text-[#5a4636]">
                {[
                  winner.has_digital ? "Digital" : null,
                  winner.has_physical ? "Físico" : null,
                ]
                  .filter(Boolean)
                  .join(" y ")}
                {winnerMeta ? ` · ${winnerMeta}` : ""}
              </p>
              <form action={setStatus} className="mt-1">
                <input type="hidden" name="id" value={winner.id} />
                <input type="hidden" name="status" value="leyendo" />
                <input type="hidden" name="ir" value="leyendo" />
                <button
                  type="submit"
                  className="h-11 cursor-pointer rounded-full bg-tinta px-4 text-sm font-bold text-crema focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta"
                >
                  Empezar a leer
                </button>
              </form>
            </div>
          </section>
        ) : matches.length === 0 ? (
          <p className="text-center text-sm text-crema-suave">
            Ningún libro cumple estos filtros. Probá aflojar alguno.
          </p>
        ) : !spinning ? (
          <p className="text-center text-sm text-crema-suave">
            Ajustá los filtros y girá la pila.
          </p>
        ) : null}
      </div>
    </div>
  );
}
