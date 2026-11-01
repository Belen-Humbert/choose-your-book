import type { BookSuggestion } from "./googleBooks";
import { normalizeText } from "./pilaSearch";

// "Juego de dos (Serie, #1)" → "Juego de dos": sin el paréntesis de la saga que agrega Goodreads.
export function cleanTitle(title: string): string {
  return title.replace(/\s*\([^)]*\)\s*$/, "").trim() || title.trim();
}

export function enrichQuery(book: { title: string; author: string | null }): string {
  return `${cleanTitle(book.title)} ${book.author ?? ""}`.trim().slice(0, 100);
}

// Elige el resultado que es el mismo libro: el título tiene que coincidir (uno contiene al otro)
// y, si los dos traen autor, compartir al menos un apellido o nombre.
export function pickMatch(
  book: { title: string; author: string | null },
  suggestions: BookSuggestion[],
): BookSuggestion | null {
  const wanted = normalizeText(cleanTitle(book.title));
  if (!wanted) return null;
  const authorWords = normalizeText(book.author ?? "")
    .split(" ")
    .filter((w) => w.length > 2);

  for (const s of suggestions) {
    const got = normalizeText(cleanTitle(s.title));
    if (!got || !(got.includes(wanted) || wanted.includes(got))) continue;
    if (authorWords.length > 0 && s.author) {
      const gotAuthor = normalizeText(s.author);
      if (!authorWords.some((w) => gotAuthor.includes(w))) continue;
    }
    return s;
  }
  return null;
}
