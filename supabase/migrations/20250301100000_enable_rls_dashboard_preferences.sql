alter table public.dashboard_preferences enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'dashboard_preferences'
      and policyname = 'Users can manage their dashboard preferences'
  ) then
    create policy "Users can manage their dashboard preferences"
      on public.dashboard_preferences
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end
$$;
