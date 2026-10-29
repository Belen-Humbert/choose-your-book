-- Portadas que suben las personas desde su dispositivo.
-- Bucket público para poder mostrar las imágenes por URL; solo se puede subir, ver y borrar
-- dentro de la carpeta propia (la primera carpeta de la ruta es el id del usuario).
-- Borrar también necesita permiso de lectura: Supabase busca el archivo antes de eliminarlo.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'covers',
  'covers',
  true,
  2097152, -- 2 MB; la app ya las achica antes de subirlas
  array['image/webp', 'image/jpeg', 'image/png']
)
on conflict (id) do nothing;

create policy "covers_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'covers'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "covers_select_own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'covers'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "covers_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'covers'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
