import { genreFromCategories, type BookSuggestion } from "./googleBooks";

// Respaldo cuando Google Books no responde o se queda sin cupo.
// Open Library es gratis y no pide API key.

type Doc = {
  key?: string;
  title?: string;
  author_name?: string[];
  number_of_pages_median?: number;
  subject?: string[];
  cover_i?: number;
};

export function toSuggestionOL(doc: Doc): BookSuggestion | null {
  const title = doc.title?.trim();
  const workId = doc.key?.replace("/works/", "");
  if (!title || !workId) return null;

  const authors = doc.author_name?.filter(Boolean).slice(0, 3) ?? [];
  const pages = doc.number_of_pages_median;

  return {
    // El prefijo evita que se mezcle con los ids de Google Books.
    googleBooksId: `ol:${workId}`,
    title,
    author: authors.length > 0 ? authors.join(", ") : null,
    genre: genreFromCategories(doc.subject?.slice(0, 30)),
    pages: typeof pages === "number" && pages > 0 ? Math.round(pages) : null,
    coverUrl: doc.cover_i
      ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
      : null,
  };
}

export async function searchOpenLibrary(query: string): Promise<BookSuggestion[]> {
  const params = new URLSearchParams({
    q: query,
    limit: "10",
    fields: "key,title,author_name,number_of_pages_median,subject,cover_i",
  });

  let response: Response;
  try {
    response = await fetch(`https://openlibrary.org/search.json?${params.toString()}`, {
      headers: {
        // Open Library pide que las apps se identifiquen.
        "User-Agent": `ChooseYourBook/1.0${
          process.env.OPEN_LIBRARY_CONTACT ? ` (${process.env.OPEN_LIBRARY_CONTACT})` : ""
        }`,
      },
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 3600 },
    });
  } catch (error) {
    const cause = (error as { cause?: { code?: string; message?: string } }).cause;
    throw new Error(
      `no se pudo conectar (${cause?.code ?? cause?.message ?? (error as Error).message})`,
    );
  }
  if (!response.ok) {
    throw new Error(`respondió ${response.status}`);
  }

  const data = (await response.json()) as { docs?: Doc[] };
  const seen = new Set<string>();
  const results: BookSuggestion[] = [];
  for (const doc of data.docs ?? []) {
    const suggestion = toSuggestionOL(doc);
    if (suggestion && !seen.has(suggestion.googleBooksId)) {
      seen.add(suggestion.googleBooksId);
      results.push(suggestion);
    }
  }
  return results;
}
