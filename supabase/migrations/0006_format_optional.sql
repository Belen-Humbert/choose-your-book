-- El formato ahora puede quedar sin definir (libros que todavía no tenés o que importaste).
alter table public.books drop constraint books_has_format;
