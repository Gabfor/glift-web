alter table public.trainings
  drop column if exists dashboard;

alter table public.trainings_admin
  drop column if exists dashboard;

alter table public.programs
  add column if not exists dashboard boolean not null default true;

update public.programs
  set dashboard = true
  where dashboard is null;
