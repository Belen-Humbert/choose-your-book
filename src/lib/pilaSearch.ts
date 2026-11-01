import type { Book } from "./types";

export type Orden = "nuevos" | "viejos";

// Minúsculas y sin tildes, para que "garcia" encuentre "García".
export function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

// Todas las palabras buscadas tienen que aparecer en el título o en el autor.
export function matchesQuery(book: Pick<Book, "title" | "author">, query: string): boolean {
  const words = normalizeText(query).split(" ").filter(Boolean);
  if (words.length === 0) return true;
  const haystack = normalizeText(`${book.title} ${book.author ?? ""}`);
  return words.every((word) => haystack.includes(word));
}

// Ordena por fecha en que se agregó. Si dos libros se agregaron a la vez (por ejemplo en una
// importación), desempata por título para que el orden sea estable.
export function sortBooks<T extends Pick<Book, "title" | "created_at">>(
  books: T[],
  orden: Orden,
): T[] {
  const sign = orden === "viejos" ? 1 : -1;
  return [...books].sort(
    (a, b) =>
      sign * (Date.parse(a.created_at) - Date.parse(b.created_at)) ||
      a.title.localeCompare(b.title, "es"),
  );
}
