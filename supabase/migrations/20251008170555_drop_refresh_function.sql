-- Supabase Migration: suppression de la fonction inutile refresh_program_store_actifs

BEGIN;

DROP FUNCTION IF EXISTS public.refresh_program_store_actifs();

COMMIT;
