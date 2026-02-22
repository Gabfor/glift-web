-- 1. Create the bucket
insert into storage.buckets (id, name, public)
values ('contact-attachments', 'contact-attachments', true)
on conflict (id) do nothing;

-- 2. Drop existing policies if any (to allow re-running this script safely)
drop policy if exists "Give public access to view attachments" on storage.objects;
drop policy if exists "Allow anyone to upload an attachment" on storage.objects;

-- 3. Policy to allow anyone (even unauthenticated users) to download/view the files in this bucket
create policy "Give public access to view attachments"
on storage.objects for select
to public
using ( bucket_id = 'contact-attachments' );

-- 4. Policy to allow anyone (even unauthenticated users) to upload a file into this bucket
create policy "Allow anyone to upload an attachment"
on storage.objects for insert
to public
with check ( bucket_id = 'contact-attachments' );
