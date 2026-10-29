import { GENRES } from "./genres";

type Genre = (typeof GENRES)[number];

// Lo que mostramos al buscar y lo que se vuelca al formulario al elegir un resultado.
export type BookSuggestion = {
  googleBooksId: string;
  title: string;
  author: string | null;
  genre: Genre | null;
  pages: number | null;
  coverUrl: string | null;
};

type Volume = {
  id?: string;
  volumeInfo?: {
    title?: string;
    authors?: string[];
    pageCount?: number;
    categories?: string[];
    imageLinks?: { thumbnail?: string };
  };
};

// Google Books devuelve categorías en inglés y muy variadas ("Fiction / Romance / General").
// Las llevamos a los géneros que usa la app. El orden importa: lo más específico primero.
const GENRE_RULES: [RegExp, Genre][] = [
  [/romanc/i, "Romance"],
  [/science fiction|sci-fi|ciencia ficci/i, "Ciencia ficción"],
  [/fantas/i, "Fantasía"],
  [/mystery|thriller|detective|crime|suspense|misterio|policial/i, "Misterio"],
  [/horror|terror/i, "Terror"],
  [/biograph|autobiograph|memoir|biograf|memorias/i, "Biografía"],
  [/essay|ensayo/i, "Ensayo"],
  [/fiction|novel|literar|ficci|novela/i, "Novela"],
];

export function genreFromCategories(categories?: string[]): Genre | null {
  if (!categories || categories.length === 0) return null;
  const text = categories.join(" / ");
  for (const [pattern, genre] of GENRE_RULES) {
    if (pattern.test(text)) return genre;
  }
  return "Otro";
}

function safeCoverUrl(thumbnail?: string): string | null {
  if (!thumbnail) return null;
  try {
    const url = new URL(thumbnail.replace(/^http:/, "https:"));
    if (url.protocol !== "https:") return null;
    url.searchParams.delete("edge");
    return url.toString();
  } catch {
    return null;
  }
}

export function toSuggestion(volume: Volume): BookSuggestion | null {
  const info = volume.volumeInfo;
  const title = info?.title?.trim();
  if (!volume.id || !title) return null;

  const authors = info?.authors?.filter(Boolean) ?? [];
  const pages = info?.pageCount;

  return {
    googleBooksId: volume.id,
    title,
    author: authors.length > 0 ? authors.join(", ") : null,
    genre: genreFromCategories(info?.categories),
    pages: typeof pages === "number" && pages > 0 ? pages : null,
    coverUrl: safeCoverUrl(info?.imageLinks?.thumbnail),
  };
}

// Se usa solo desde el servidor (route handler), así la API key, si hay una, no llega al navegador.
export async function searchGoogleBooks(query: string): Promise<BookSuggestion[]> {
  const params = new URLSearchParams({
    q: query,
    maxResults: "10",
    printType: "books",
    fields:
      "items(id,volumeInfo(title,authors,pageCount,categories,imageLinks/thumbnail))",
  });
  if (process.env.GOOGLE_BOOKS_API_KEY) {
    params.set("key", process.env.GOOGLE_BOOKS_API_KEY);
  }

  const response = await fetch(
    `https://www.googleapis.com/books/v1/volumes?${params.toString()}`,
    { next: { revalidate: 3600 } },
  );
  if (!response.ok) {
    throw new Error(`Google Books respondió ${response.status}`);
  }

  const data = (await response.json()) as { items?: Volume[] };
  const seen = new Set<string>();
  const results: BookSuggestion[] = [];
  for (const item of data.items ?? []) {
    const suggestion = toSuggestion(item);
    if (suggestion && !seen.has(suggestion.googleBooksId)) {
      seen.add(suggestion.googleBooksId);
      results.push(suggestion);
    }
  }
  return results;
}
