-- Ensure profiles.email_verified is synced with Supabase auth email confirmations
create or replace function auth.handle_profile_email_verified()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if tg_op = 'INSERT' then
    if new.email_confirmed_at is not null then
      update public.profiles
         set email_verified = true,
             updated_at = now()
       where id = new.id;
    end if;

    return new;
  end if;

  if new.email_confirmed_at is not null
     and (old.email_confirmed_at is distinct from new.email_confirmed_at) then
    update public.profiles
       set email_verified = true,
           updated_at = now()
     where id = new.id;
  elsif new.email_confirmed_at is null and old.email_confirmed_at is not null then
    update public.profiles
       set email_verified = false,
           updated_at = now()
     where id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_email_confirmed on auth.users;

create trigger on_auth_user_email_confirmed
  after insert or update on auth.users
  for each row
  execute function auth.handle_profile_email_verified();

-- Backfill already confirmed users
update public.profiles as p
   set email_verified = true,
       updated_at = now()
  from auth.users as u
 where u.id = p.id
   and u.email_confirmed_at is not null
   and p.email_verified is distinct from true;
