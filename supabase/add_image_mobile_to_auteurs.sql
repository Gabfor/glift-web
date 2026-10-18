-- Ajout de la colonne image_mobile pour les visuels d'auteurs en responsive
ALTER TABLE public.auteurs 
ADD COLUMN IF NOT EXISTS image_mobile TEXT;
