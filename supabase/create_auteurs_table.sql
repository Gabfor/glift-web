-- Create auteurs table
create table if not exists public.auteurs (
  id uuid primary key default gen_random_uuid(),
  prenom text not null,
  nom text not null,
  poste_actuel text,
  image_url text,
  image_alt text,
  experience text,
  expertise text,
  description_courte text,
  description text,
  liens_sociaux jsonb default '[]'::jsonb,
  statut boolean default true,
  langue text default 'Français',
  created_at timestamp with time zone default timezone('utc', now()),
  updated_at timestamp with time zone default timezone('utc', now())
);

-- Enable Row Level Security (RLS)
alter table public.auteurs enable row level security;

-- Policies for public read-only access (for displaying authors on the blog/site)
create policy "Allow public read access on auteurs"
  on public.auteurs for select
  using (true);

-- Policies for full management by authenticated (admin) users
create policy "Allow full access to authenticated users on auteurs"
  on public.auteurs for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Create storage bucket for author profiles if it doesn't exist
insert into storage.buckets (id, name, public)
values ('author-images', 'author-images', true)
on conflict (id) do nothing;

-- Storage policies for the bucket
create policy "Author images public access"
  on storage.objects for select
  using ( bucket_id = 'author-images' );

create policy "Author images authenticated upload access"
  on storage.objects for insert
  with check ( bucket_id = 'author-images' and auth.role() = 'authenticated' );

create policy "Author images authenticated update access"
  on storage.objects for update
  using ( bucket_id = 'author-images' and auth.role() = 'authenticated' );

create policy "Author images authenticated delete access"
  on storage.objects for delete
  using ( bucket_id = 'author-images' and auth.role() = 'authenticated' );
