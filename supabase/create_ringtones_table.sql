-- Create ringtones (sonneries) table
create table if not exists public.ringtones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  filename text not null,
  url text not null,
  duration_ms integer not null default 0,
  is_active boolean not null default true,
  is_default boolean not null default false,
  created_at timestamp with time zone default timezone('utc', now()),
  updated_at timestamp with time zone default timezone('utc', now())
);

-- Enable RLS
alter table public.ringtones enable row level security;

-- Allow public read access
create policy "Public read ringtones"
  on public.ringtones for select
  using (true);

-- Allow authenticated users to manage ringtones
create policy "Authenticated ringtones access"
  on public.ringtones for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Create storage bucket for ringtones if not exists
insert into storage.buckets (id, name, public)
values ('ringtones', 'ringtones', true)
on conflict (id) do nothing;

-- Storage policies
create policy "Ringtones Bucket Public Access"
  on storage.objects for select
  using ( bucket_id = 'ringtones' );

create policy "Ringtones Bucket Authenticated Upload"
  on storage.objects for insert
  with check ( bucket_id = 'ringtones' and auth.role() = 'authenticated' );

create policy "Ringtones Bucket Authenticated Update"
  on storage.objects for update
  using ( bucket_id = 'ringtones' and auth.role() = 'authenticated' );

create policy "Ringtones Bucket Authenticated Delete"
  on storage.objects for delete
  using ( bucket_id = 'ringtones' and auth.role() = 'authenticated' );

-- Pre-populate initial ringtones
insert into public.ringtones (name, filename, url, duration_ms, is_active, is_default)
values
  ('Bip', 'bip.mp3', '/sounds/bip.mp3', 696, true, false),
  ('Radar', 'radar.mp3', '/sounds/radar.mp3', 1567, true, true),
  ('Gong', 'gong.mp3', '/sounds/gong.mp3', 2520, true, false),
  ('Cloche', 'bell.mp3', '/sounds/bell.mp3', 3720, true, false)
on conflict do nothing;

