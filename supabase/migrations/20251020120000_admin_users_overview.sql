-- Add subscription and trial fields to profiles
alter table public.profiles
  add column if not exists subscription_plan text,
  add column if not exists premium_trial_started_at timestamptz;

update public.profiles as p
   set subscription_plan = coalesce(
     (
       select plan
         from public.user_subscriptions as us
        where us.user_id = p.id
        limit 1
     ),
     'basic'
   )
 where p.subscription_plan is null;

alter table public.profiles
  alter column subscription_plan set default 'basic';

update public.profiles
   set subscription_plan = 'basic'
 where subscription_plan is null;

alter table public.profiles
  alter column subscription_plan set not null;

-- Keep profiles.subscription_plan in sync with user_subscriptions
create or replace function public.update_profile_subscription_plan()
returns trigger
language plpgsql
as $$
begin
  update public.profiles
     set subscription_plan = new.plan,
         updated_at = now()
   where id = new.user_id;

  return new;
end;
$$;

drop trigger if exists user_subscriptions_update_profile_plan on public.user_subscriptions;
create trigger user_subscriptions_update_profile_plan
  after insert or update on public.user_subscriptions
  for each row
  execute function public.update_profile_subscription_plan();

create or replace function public.reset_profile_subscription_plan()
returns trigger
language plpgsql
as $$
begin
  update public.profiles
     set subscription_plan = 'basic',
         updated_at = now()
   where id = old.user_id;

  return old;
end;
$$;

drop trigger if exists user_subscriptions_reset_profile_plan on public.user_subscriptions;
create trigger user_subscriptions_reset_profile_plan
  after delete on public.user_subscriptions
  for each row
  execute function public.reset_profile_subscription_plan();

-- Helper to ensure only admins can call privileged functions
create schema if not exists admin;

do $$
begin
  if not exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where p.proname = 'ensure_admin'
       and n.nspname = 'admin'
  ) then
    create function admin.ensure_admin()
    returns void
    language plpgsql
    security definer
    set search_path = public, auth
    as $$
    begin
      if auth.uid() is null then
        raise exception 'not authenticated';
      end if;

      if not exists (
        select 1
          from auth.users as admin_user
         where admin_user.id = auth.uid()
           and coalesce((admin_user.raw_user_meta_data ->> 'is_admin')::boolean, false)
      ) then
        raise exception 'not authorized';
      end if;
    end;
    $$;
  end if;
end;
$$;

-- Admin function to list users with profile information
create or replace function admin.list_users()
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
set search_path = public, auth
as $$
begin
  perform admin.ensure_admin();

  return query
  select
    u.id,
    u.email,
    u.created_at,
    p.name,
    p.subscription_plan,
    p.premium_trial_started_at,
    p.gender,
    p.birth_date,
    p.email_verified
  from auth.users as u
  left join public.profiles as p on p.id = u.id
  order by u.created_at desc;
end;
$$;

grant usage on schema admin to authenticated;
grant execute on function admin.list_users() to authenticated;

-- Admin function to toggle email verification
create or replace function admin.set_user_email_verification(target_user uuid, verified boolean)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  perform admin.ensure_admin();

  if verified then
    update auth.users
       set email_confirmed_at = now()
     where id = target_user;
  else
    update auth.users
       set email_confirmed_at = null
     where id = target_user;
  end if;

  update public.profiles
     set email_verified = verified,
         updated_at = now()
   where id = target_user;
end;
$$;

grant execute on function admin.set_user_email_verification(uuid, boolean) to authenticated;
