-- Reduce the email verification grace period from 7 days to 48 hours
alter table public.profiles
  alter column grace_expires_at
  set default (now() + interval '48 hours');

update public.profiles
   set grace_expires_at = coalesce(created_at, now()) + interval '48 hours',
       updated_at = now()
 where email_verified is distinct from true;
