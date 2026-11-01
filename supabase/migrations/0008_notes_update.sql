-- Permite editar las propias notas (antes solo se podían crear y borrar).
create policy "notes_update_own" on public.book_notes
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
