-- Ensure we can reset the email confirmation flag without confirming the email
create or replace function auth.reset_email_confirmation(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = auth
as $$
declare
  updated_count integer;
begin
  update auth.users
     set email_confirmed_at = null,
         updated_at = timezone('utc', now())
   where id = p_user_id;

  get diagnostics updated_count = row_count;

  return updated_count > 0;
end;
$$;
