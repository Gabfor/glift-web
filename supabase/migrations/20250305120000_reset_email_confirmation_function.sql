create or replace function public.admin_reset_email_confirmation(target_user uuid)
returns void
language plpgsql
security definer
set search_path = public, auth, admin
as $$
begin
  perform admin.ensure_admin();

  update auth.users
  set email_confirmed_at = null,
      confirmed_at = null
  where id = target_user;

  update auth.identities
  set email_confirmed_at = null
  where user_id = target_user
    and provider = 'email';
end;
$$;

grant execute on function public.admin_reset_email_confirmation(uuid) to authenticated;
