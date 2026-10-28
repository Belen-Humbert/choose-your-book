-- Libros pendientes de cada usuario.
create table public.books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null,
  author text,
  genre text,
  pages integer check (pages is null or pages > 0),
  cover_url text,
  google_books_id text,
  has_digital boolean not null default false,
  has_physical boolean not null default false,
  status text not null default 'pendiente' check (status in ('pendiente', 'leyendo', 'leido')),
  created_at timestamptz not null default now(),
  -- el libro tiene que estar al menos en un formato
  constraint books_has_format check (has_digital or has_physical)
);

create index books_user_status_idx on public.books (user_id, status);

-- Un mismo libro de Google Books no se carga dos veces por usuario.
create unique index books_user_google_id_key
  on public.books (user_id, google_books_id)
  where google_books_id is not null;

-- Cada persona ve y toca solo sus libros.
alter table public.books enable row level security;

create policy "books_select_own" on public.books
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "books_insert_own" on public.books
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "books_update_own" on public.books
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "books_delete_own" on public.books
  for delete to authenticated
  using ((select auth.uid()) = user_id);
