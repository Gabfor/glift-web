-- ========================================================
-- Migration: Restreindre les politiques RLS aux vrais administrateurs
-- ========================================================

-- 1. Table public.settings
-- Lecture : Tout le monde (public)
-- Écriture/Modification/Suppression : Administrateurs uniquement
DROP POLICY IF EXISTS "Authenticated update access" ON public.settings;
DROP POLICY IF EXISTS "Admin full access on settings" ON public.settings;

CREATE POLICY "Admin full access on settings"
  ON public.settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- 2. Table public.auteurs
-- Lecture : Tout le monde (public)
-- Écriture/Modification/Suppression : Administrateurs uniquement
DROP POLICY IF EXISTS "Allow full access to authenticated users on auteurs" ON public.auteurs;
DROP POLICY IF EXISTS "Admin full access on auteurs" ON public.auteurs;

CREATE POLICY "Admin full access on auteurs"
  ON public.auteurs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- 3. Storage Buckets (logos & author-images)
-- Écriture/Modification/Suppression réservées aux admins
DROP POLICY IF EXISTS "Authenticated Upload Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete Access" ON storage.objects;

DROP POLICY IF EXISTS "Author images authenticated upload access" ON storage.objects;
DROP POLICY IF EXISTS "Author images authenticated update access" ON storage.objects;
DROP POLICY IF EXISTS "Author images authenticated delete access" ON storage.objects;

-- Politiques de stockage administrateur
CREATE POLICY "Admin upload logos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'logos' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admin upload author images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'author-images' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

