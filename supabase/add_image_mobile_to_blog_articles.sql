-- Ajout de la colonne image_mobile pour les visuels d'articles de blog en responsive
ALTER TABLE public.blog_articles 
ADD COLUMN IF NOT EXISTS image_mobile TEXT;
