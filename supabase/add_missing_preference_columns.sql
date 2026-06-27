-- Migration to add missing preference columns to the preferences table.
-- You can run this in the Supabase Dashboard SQL Editor.

ALTER TABLE public.preferences
ADD COLUMN IF NOT EXISTS show_suivi boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS show_superset boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS show_summary boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS show_goals boolean NOT NULL DEFAULT true;
