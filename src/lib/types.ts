// Una fila de la tabla `book_notes` (ver supabase/migrations/0004_notes.sql y 0005_progress_percent.sql).
export type BookNote = {
  id: string;
  book_id: string;
  user_id: string;
  body: string;
  page: number | null; // página en la que ibas al escribirla
  percent: number | null; // porcentaje en el que ibas al escribirla (0 a 100)
  created_at: string; // fecha y hora en UTC (ISO)
};

export type BookStatus = "pendiente" | "leyendo" | "leido";

// Una fila de la tabla `books` (ver supabase/migrations/0001_books.sql, 0003 y 0005).
export type Book = {
  id: string;
  user_id: string;
  title: string;
  author: string | null;
  genre: string | null;
  pages: number | null;
  current_page: number; // página por la que va (0 si todavía no empezó)
  current_percent: number | null; // último avance anotado, en % (null si no se anotó ninguno)
  cover_url: string | null;
  google_books_id: string | null;
  has_digital: boolean;
  has_physical: boolean;
  status: BookStatus;
  created_at: string;
};
