import type { Book, BookNote } from "./types";

// Porcentaje leído (0 a 100). Devuelve null si no se puede calcular (no se sabe el total de páginas).
export function progressPercent(
  currentPage: number,
  pages: number | null,
): number | null {
  if (!pages || pages <= 0) return null;
  const ratio = Math.max(0, currentPage) / pages;
  return Math.min(100, Math.round(ratio * 100));
}

// A qué página corresponde un porcentaje, para un libro con `pages` páginas.
export function pageFromPercent(percent: number, pages: number): number {
  const clamped = Math.min(100, Math.max(0, percent));
  return Math.min(pages, Math.round((clamped / 100) * pages));
}

type ProgressFields = Pick<Book, "pages" | "current_page" | "current_percent">;

// El avance de un libro en %. Si se anotó un porcentaje, ese manda (es el que mostraba el
// lector digital); si no, se calcula con la página y el total.
export function bookPercent(book: ProgressFields): number | null {
  if (book.current_percent !== null && book.current_percent !== undefined) {
    return book.current_percent;
  }
  return progressPercent(book.current_page, book.pages);
}

// Texto corto de dónde va el libro.
export function progressSummary(book: ProgressFields): string {
  if (book.pages) return `Página ${book.current_page} de ${book.pages}`;
  const percent = bookPercent(book);
  if (percent !== null) return `Vas por el ${percent}%`;
  if (book.current_page > 0) return `Vas por la página ${book.current_page}`;
  return "Todavía no empezaste";
}

// Dónde ibas al escribir una nota. Las notas viejas no tenían porcentaje: si se sabe el total
// de páginas del libro, se calcula con la página que tenían.
export function notePosition(
  note: Pick<BookNote, "page" | "percent">,
  bookPages: number | null,
): { page: number | null; percent: number | null } {
  const percent =
    note.percent ??
    (note.page !== null ? progressPercent(note.page, bookPages) : null);
  return { page: note.page, percent };
}

// "Página 225 · 54%", "Página 80" o "54%". Vacío si la nota no tiene posición.
export function positionLabel(position: {
  page: number | null;
  percent: number | null;
}): string {
  const parts: string[] = [];
  if (position.page !== null) parts.push(`Página ${position.page}`);
  if (position.percent !== null) parts.push(`${position.percent}%`);
  return parts.join(" · ");
}
