export type BookStatus = "pendiente" | "leyendo" | "leido";

// Una fila de la tabla `books` (ver supabase/migrations/0001_books.sql).
export type Book = {
  id: string;
  user_id: string;
  title: string;
  author: string | null;
  genre: string | null;
  pages: number | null;
  cover_url: string | null;
  google_books_id: string | null;
  has_digital: boolean;
  has_physical: boolean;
  status: BookStatus;
  created_at: string;
};
