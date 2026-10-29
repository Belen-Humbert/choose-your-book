import { searchGoogleBooks, type BookSuggestion } from "./googleBooks";
import { searchOpenLibrary } from "./openLibrary";

export type SearchSource = "google" | "openlibrary";

// Busca primero en Google Books. Si falla (cuota, caída, red) o no encuentra nada,
// prueba con Open Library.
export async function searchBooks(
  query: string,
): Promise<{ results: BookSuggestion[]; source: SearchSource }> {
  let googleError: Error | null = null;

  try {
    const results = await searchGoogleBooks(query);
    if (results.length > 0) return { results, source: "google" };
  } catch (error) {
    googleError = error as Error;
  }

  try {
    const results = await searchOpenLibrary(query);
    return { results, source: "openlibrary" };
  } catch (error) {
    if (googleError) {
      // Fallaron las dos: dejamos los dos motivos para poder diagnosticar.
      throw new Error(`${googleError.message}. Open Library: ${(error as Error).message}`);
    }
    // Google respondió bien pero sin resultados, y el respaldo no estaba disponible.
    return { results: [], source: "google" };
  }
}
