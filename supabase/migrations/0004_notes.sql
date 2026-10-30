-- Notas de lectura: cada nota queda con su fecha y hora (created_at) y la página en la que ibas.
create table public.book_notes (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  page integer check (page is null or page >= 0),
  created_at timestamptz not null default now()
);

create index book_notes_book_idx on public.book_notes (book_id, created_at desc);

-- Cada persona ve y toca solo sus notas, y solo puede escribir en libros propios.
alter table public.book_notes enable row level security;

create policy "notes_select_own" on public.book_notes
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "notes_insert_own" on public.book_notes
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.books b
      where b.id = book_id and b.user_id = (select auth.uid())
    )
  );

create policy "notes_delete_own" on public.book_notes
  for delete to authenticated
  using ((select auth.uid()) = user_id);
