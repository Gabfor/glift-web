-- Add short name support for programs and program_store entries
ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS name_short VARCHAR(28);

ALTER TABLE public.program_store
  ADD COLUMN IF NOT EXISTS name_short VARCHAR(28);
