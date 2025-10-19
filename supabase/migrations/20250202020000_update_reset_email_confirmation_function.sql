-- Ensure email confirmation reset clears both auth confirmation fields
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
         confirmed_at = null,
         updated_at = timezone('utc', now())
   where id = p_user_id;

  get diagnostics updated_count = row_count;

  return updated_count > 0;
end;
$$;
