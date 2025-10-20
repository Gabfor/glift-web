-- Ensure profile updates drive auth.users metadata
alter table public.profiles
  add column if not exists avatar_url text,
  add column if not exists avatar_path text;

create or replace function public.sync_profile_user_metadata()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_metadata jsonb;
  profile_metadata jsonb;
  updated_metadata jsonb;
begin
  select coalesce(raw_user_meta_data, '{}'::jsonb)
    into current_metadata
    from auth.users
   where id = new.id
   for update;

  if not found then
    return new;
  end if;

  profile_metadata := jsonb_build_object(
    'name', coalesce(to_jsonb(new.name), 'null'::jsonb),
    'birth_date',
      case
        when new.birth_date is not null then to_jsonb(to_char(new.birth_date, 'YYYY-MM-DD'))
        else 'null'::jsonb
      end,
    'gender', coalesce(to_jsonb(new.gender), 'null'::jsonb),
    'country', coalesce(to_jsonb(new.country), 'null'::jsonb),
    'experience', coalesce(to_jsonb(new.experience), 'null'::jsonb),
    'main_goal', coalesce(to_jsonb(new.main_goal), 'null'::jsonb),
    'training_place', coalesce(to_jsonb(new.training_place), 'null'::jsonb),
    'weekly_sessions', coalesce(to_jsonb(new.weekly_sessions), 'null'::jsonb),
    'supplements', coalesce(to_jsonb(new.supplements), 'null'::jsonb),
    'avatar_url', coalesce(to_jsonb(new.avatar_url), 'null'::jsonb),
    'avatar_path', coalesce(to_jsonb(new.avatar_path), 'null'::jsonb)
  );

  updated_metadata := current_metadata || profile_metadata;

  update auth.users as u
     set raw_user_meta_data = updated_metadata,
         updated_at = greatest(u.updated_at, now())
   where u.id = new.id;

  return new;
end;
$$;

comment on function public.sync_profile_user_metadata()
  is 'Propagate profile updates to auth.users.user_metadata to keep clients in sync.';

drop trigger if exists profiles_sync_user_metadata on public.profiles;

create trigger profiles_sync_user_metadata
  after insert or update on public.profiles
  for each row
  execute function public.sync_profile_user_metadata();

-- Backfill existing metadata
update public.profiles
   set updated_at = updated_at;
