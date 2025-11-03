alter table public.dashboard_preferences enable row level security;

create policy if not exists "Users can manage their dashboard preferences"
  on public.dashboard_preferences
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
