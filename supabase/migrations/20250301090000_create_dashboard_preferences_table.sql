create table if not exists public.dashboard_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  selected_program_id uuid references public.programs (id) on delete set null,
  selected_training_id uuid references public.trainings (id) on delete set null,
  exercise_settings jsonb not null default '{}'::jsonb,
  show_stats boolean not null default false,
  updated_at timestamptz not null default now()
);

create index if not exists dashboard_preferences_program_idx
  on public.dashboard_preferences (selected_program_id);

create index if not exists dashboard_preferences_training_idx
  on public.dashboard_preferences (selected_training_id);
