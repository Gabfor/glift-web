import { SupabaseClient } from "@supabase/supabase-js";

export async function resetEmailConfirmation(
  adminClient: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { error } = await adminClient.rpc("auth.reset_email_confirmation", {
    user_id: userId,
  });

  if (error) {
    console.warn("Reset email confirmation RPC failed", error, { userId });
    return false;
  }

  return true;
}
