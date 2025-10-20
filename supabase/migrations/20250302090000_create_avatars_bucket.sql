-- Ensure the avatars storage bucket exists and is publicly accessible
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update
  set public = excluded.public;

-- Allow authenticated users to manage objects inside their own folder
-- within the avatars bucket. Each file path is expected to start with the
-- authenticated user's UUID (e.g. `<user_id>/file.png`).
drop policy if exists "Users can upload their avatars" on storage.objects;
create policy "Users can upload their avatars"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "Users can update their avatars" on storage.objects;
create policy "Users can update their avatars"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "Users can delete their avatars" on storage.objects;
create policy "Users can delete their avatars"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "Anyone can view public avatars" on storage.objects;
create policy "Anyone can view public avatars"
  on storage.objects
  for select
  to public
  using (bucket_id = 'avatars');
