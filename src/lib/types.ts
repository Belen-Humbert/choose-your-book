// Una fila de la tabla `book_notes` (ver supabase/migrations/0004_notes.sql).
export type BookNote = {
  id: string;
  book_id: string;
  user_id: string;
  body: string;
  page: number | null; // página en la que ibas al escribirla
  created_at: string; // fecha y hora en UTC (ISO)
};

export type BookStatus = "pendiente" | "leyendo" | "leido";

// Una fila de la tabla `books` (ver supabase/migrations/0001_books.sql).
export type Book = {
  id: string;
  user_id: string;
  title: string;
  author: string | null;
  genre: string | null;
  pages: number | null;
  current_page: number; // página por la que va (0 si todavía no empezó)
  cover_url: string | null;
  google_books_id: string | null;
  has_digital: boolean;
  has_physical: boolean;
  status: BookStatus;
  created_at: string;
};
