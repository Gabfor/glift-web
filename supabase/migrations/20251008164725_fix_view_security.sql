-- Migration: Supprimer SECURITY DEFINER sur la vue public.program_store_actifs

DROP VIEW IF EXISTS public.program_store_actifs CASCADE;

CREATE VIEW public.program_store_actifs AS
SELECT
  id,
  image,
  title,
  partner_image,
  partner_link,
  level,
  sessions,
  duration,
  description,
  link,
  created_by,
  is_active
FROM public.program_store
WHERE is_active = true;

COMMENT ON VIEW public.program_store_actifs IS
'Vue publique filtrant les programmes actifs. Créée proprement (SECURITY INVOKER implicite).';
