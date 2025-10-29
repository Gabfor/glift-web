import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";

export async function resetEmailConfirmation(
  adminClient: SupabaseClient<Database>,
  userId: string,
): Promise<boolean> {
  try {
    const { error: resetError } = await adminClient.rpc(
      "admin_reset_email_confirmation",
      {
        target_user: userId,
      },
    );

    if (resetError) {
      if (resetError.code === "PGRST202") {
        const { error: adminFallbackError } =
          await adminClient.auth.admin.updateUserById(userId, {
            email_confirm: false,
          });

        if (adminFallbackError) {
          console.warn(
            "resetEmailConfirmation() fallback unable to clear auth email confirmation",
            adminFallbackError,
          );
          return false;
        }
      } else {
        console.warn(
          "resetEmailConfirmation() unable to clear auth email confirmation",
          resetError,
        );
        return false;
      }
    }

    const { error: verificationResetError } = await adminClient.rpc(
      "admin_set_user_email_verification",
      {
        target_user: userId,
        verified: false,
      },
    );

    if (verificationResetError) {
      if (verificationResetError.code === "PGRST202") {
        const { error: profileFallbackError } = await adminClient
          .from("profiles")
          .update({ email_verified: false })
          .eq("id", userId);

        if (profileFallbackError) {
          console.warn(
            "resetEmailConfirmation() fallback unable to reset profile email verification",
            profileFallbackError,
          );
          return false;
        }
      } else {
        console.warn(
          "resetEmailConfirmation() unable to reset profile email verification",
          verificationResetError,
        );
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error(
      "resetEmailConfirmation() unexpected error while clearing email confirmation",
      error,
    );
    return false;
  }
}
