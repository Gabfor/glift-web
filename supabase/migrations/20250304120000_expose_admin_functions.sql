create or replace function public.admin_list_users()
returns table (
  id uuid,
  email text,
  created_at timestamptz,
  name text,
  subscription_plan text,
  premium_trial_started_at timestamptz,
  gender text,
  birth_date date,
  email_verified boolean
)
language plpgsql
security definer
set search_path = public, auth, admin
as $$
begin
  perform admin.ensure_admin();

  return query
  select * from admin.list_users();
end;
$$;

grant execute on function public.admin_list_users() to authenticated;

drop function if exists public.admin_set_user_email_verification(uuid, boolean);
create function public.admin_set_user_email_verification(target_user uuid, verified boolean)
returns void
language plpgsql
security definer
set search_path = public, auth, admin
as $$
begin
  perform admin.ensure_admin();
  perform admin.set_user_email_verification(target_user, verified);
end;
$$;

grant execute on function public.admin_set_user_email_verification(uuid, boolean) to authenticated;
