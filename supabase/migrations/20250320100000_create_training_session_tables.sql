create table if not exists public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  program_id uuid references public.programs (id) on delete set null,
  training_id uuid references public.trainings (id) on delete set null,
  performed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists training_sessions_user_idx
  on public.training_sessions (user_id, performed_at desc);

create index if not exists training_sessions_training_idx
  on public.training_sessions (training_id);

create table if not exists public.training_session_exercises (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.training_sessions (id) on delete cascade,
  training_row_id uuid references public.training_rows (id) on delete set null,
  exercise_name text not null,
  position integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists training_session_exercises_session_idx
  on public.training_session_exercises (session_id);

create index if not exists training_session_exercises_training_row_idx
  on public.training_session_exercises (training_row_id);

create table if not exists public.training_session_sets (
  id uuid primary key default gen_random_uuid(),
  session_exercise_id uuid not null references public.training_session_exercises (id) on delete cascade,
  set_number integer not null check (set_number > 0),
  repetitions integer not null check (repetitions >= 0),
  weights numeric[] not null default '{}'::numeric[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (cardinality(weights) = repetitions)
);

create index if not exists training_session_sets_exercise_idx
  on public.training_session_sets (session_exercise_id);

alter table public.training_sessions enable row level security;
alter table public.training_session_exercises enable row level security;
alter table public.training_session_sets enable row level security;

create policy if not exists "Users can manage their training sessions"
  on public.training_sessions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy if not exists "Users can manage their session exercises"
  on public.training_session_exercises
  for all
  using (
    exists (
      select 1
      from public.training_sessions s
      where s.id = session_id
        and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.training_sessions s
      where s.id = session_id
        and s.user_id = auth.uid()
    )
  );

create policy if not exists "Users can manage their session sets"
  on public.training_session_sets
  for all
  using (
    exists (
      select 1
      from public.training_session_exercises e
      join public.training_sessions s on s.id = e.session_id
      where e.id = session_exercise_id
        and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.training_session_exercises e
      join public.training_sessions s on s.id = e.session_id
      where e.id = session_exercise_id
        and s.user_id = auth.uid()
    )
  );
