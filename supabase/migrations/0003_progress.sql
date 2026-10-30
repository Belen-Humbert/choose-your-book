-- Progreso de lectura: en qué página va cada libro.
alter table public.books
  add column current_page integer not null default 0 check (current_page >= 0);
