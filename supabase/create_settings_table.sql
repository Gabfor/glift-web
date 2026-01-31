-- Create settings table if it doesn't exist
create table if not exists public.settings (
  key text primary key,
  value text not null,
  created_at timestamp with time zone default timezone('utc', now()),
  updated_at timestamp with time zone default timezone('utc', now())
);

-- Enable RLS
alter table public.settings enable row level security;

-- Policies for settings
-- Allow public read access (so authenticated and unauthenticated users can see the logo)
create policy "Public read access"
  on public.settings for select
  using (true);

-- Allow full access to authenticated users (admin verification should be done at app level or via strict RLS if role column exists)
-- Since we don't have a reliable admin role check in the schema visible, we'll restrict to authenticated for now.
-- In a real production env, this should be stricter.
create policy "Authenticated update access"
  on public.settings for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Create storage bucket for logos if it doesn't exist
-- Note: Supabase SQL doesn't have a direct "create bucket if not exists" easily without extension, 
-- but we can try inserting into storage.buckets.
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

-- Storage policies
create policy "Logo Public Access"
  on storage.objects for select
  using ( bucket_id = 'logos' );

create policy "Authenticated Upload Access"
  on storage.objects for insert
  with check ( bucket_id = 'logos' and auth.role() = 'authenticated' );

create policy "Authenticated Update Access"
  on storage.objects for update
  using ( bucket_id = 'logos' and auth.role() = 'authenticated' );

create policy "Authenticated Delete Access"
  on storage.objects for delete
  using ( bucket_id = 'logos' and auth.role() = 'authenticated' );
