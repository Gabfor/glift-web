alter table public.dashboard_preferences
  add column if not exists selected_exercise_id uuid null;

alter table public.dashboard_preferences
  add constraint dashboard_preferences_selected_exercise_id_fkey
  foreign key (selected_exercise_id) references training_rows (id)
  on delete set null;

create index if not exists dashboard_preferences_exercise_idx
  on public.dashboard_preferences using btree (selected_exercise_id);
