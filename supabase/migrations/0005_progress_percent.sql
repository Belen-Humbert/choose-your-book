-- Porcentaje de lectura. Los lectores digitales (Kindle y otros) muestran el avance en %, y
-- hay libros sin total de páginas cargado: ahí el porcentaje es la única forma de registrar dónde ibas.
-- Libro: el último avance que se anotó, en %. Nota: en qué % ibas al escribirla.
alter table public.books
  add column current_percent smallint
  check (current_percent is null or current_percent between 0 and 100);

alter table public.book_notes
  add column percent smallint
  check (percent is null or percent between 0 and 100);
