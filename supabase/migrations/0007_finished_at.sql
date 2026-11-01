-- Cuándo terminaste de leer cada libro (para ordenar los leídos por fecha de lectura).
alter table public.books add column finished_at timestamptz;
