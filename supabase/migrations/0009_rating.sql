-- Calificación de 1 a 5 estrellas de los libros leídos (null: sin calificar).
alter table public.books
  add column rating smallint check (rating is null or rating between 1 and 5);
