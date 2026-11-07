-- Ajout de la colonne is_hidden pour masquer des exercices (invisible uniquement dans l'entraînement actif sur mobile)
ALTER TABLE public.training_rows 
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;

ALTER TABLE public.training_rows_admin 
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;

