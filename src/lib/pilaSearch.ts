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

// Ordena por la fecha en que se agregó o, en los leídos, por la fecha en que se terminó (los que no
// la tienen usan la de agregado). Si dos libros tienen la misma fecha, desempata por título.
export function sortBooks<
  T extends Pick<Book, "title" | "created_at"> & { finished_at?: string | null },
>(books: T[], orden: Orden, by: "agregado" | "terminado" = "agregado"): T[] {
  const sign = orden === "viejos" ? 1 : -1;
  const date = (b: T) =>
    Date.parse(by === "terminado" ? (b.finished_at ?? b.created_at) : b.created_at);
  return [...books].sort(
    (a, b) => sign * (date(a) - date(b)) || a.title.localeCompare(b.title, "es"),
  );
}
