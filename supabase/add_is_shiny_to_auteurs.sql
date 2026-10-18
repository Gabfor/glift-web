-- Ajout de la colonne is_shiny pour activer l'effet shiny sur les profils d'auteurs
ALTER TABLE public.auteurs 
ADD COLUMN IF NOT EXISTS is_shiny BOOLEAN DEFAULT false;
