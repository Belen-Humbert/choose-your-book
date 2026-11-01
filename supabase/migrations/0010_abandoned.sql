-- Nuevo estado de lectura: "abandonado" (libros que empezaste y dejaste).
alter table public.books drop constraint books_status_check;
alter table public.books
  add constraint books_status_check
  check (status in ('pendiente', 'leyendo', 'leido', 'abandonado'));
