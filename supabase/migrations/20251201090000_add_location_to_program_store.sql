-- Ajout de la colonne location pour distinguer Salle / Domicile
ALTER TABLE public.program_store
  ADD COLUMN IF NOT EXISTS location text;

-- Facultatif : assurer que seules les valeurs attendues sont stockées
ALTER TABLE public.program_store
  ADD CONSTRAINT program_store_location_check
  CHECK (location IS NULL OR location IN ('Salle', 'Domicile'));
