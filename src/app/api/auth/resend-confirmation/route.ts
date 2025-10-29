import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { resetEmailConfirmation } from "@/lib/auth/resetEmailConfirmation";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("[resend-confirmation] Unable to retrieve authenticated user", userError);
      const status = userError.status === 401 ? 401 : 500;
      return NextResponse.json({ error: "Utilisateur non authentifié." }, { status });
    }

    const email = user?.email?.trim();
    const userId = user?.id ?? null;

    if (!email) {
      console.warn(
        "[resend-confirmation] Authenticated user does not have an email address",
      );
      return NextResponse.json(
        { error: "Adresse email introuvable pour l'utilisateur." },
        { status: 400 },
      );
    }

    if (userId) {
      try {
        const adminClient = createAdminClient();
        const { data: adminUserData, error: adminLookupError } =
          await adminClient.auth.admin.getUserById(userId);

        if (adminLookupError) {
          console.warn(
            "[resend-confirmation] Unable to retrieve user with admin client before resending email",
            adminLookupError,
          );
        } else {
          const isConfirmed = Boolean(
            adminUserData?.user?.email_confirmed_at ??
              adminUserData?.user?.confirmed_at,
          );

          if (isConfirmed) {
            const resetSuccess = await resetEmailConfirmation(
              adminClient,
              userId,
            );

            if (!resetSuccess) {
              console.error(
                "[resend-confirmation] Unable to reset Supabase email confirmation before resending",
                { userId },
              );
              return NextResponse.json(
                {
                  error:
                    "Impossible de renvoyer l'email de confirmation pour le moment.",
                },
                { status: 500 },
              );
            }
          }
        }
      } catch (adminClientError) {
        console.error(
          "[resend-confirmation] Unable to create admin Supabase client before resending",
          adminClientError,
        );
        return NextResponse.json(
          { error: "Configuration Supabase incomplète." },
          { status: 500 },
        );
      }
    }

    const emailRedirectTo = new URL("/auth/callback", request.nextUrl.origin).toString();

    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo },
    });

    if (resendError) {
      console.error(
        "[resend-confirmation] Supabase failed to resend confirmation email",
        resendError,
      );
      return NextResponse.json(
        { error: "Échec de l'envoi de l'email de confirmation." },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(
      "[resend-confirmation] Unexpected error when resending confirmation email",
      error,
    );
    return NextResponse.json(
      { error: "Erreur inattendue lors de l'envoi de l'email de confirmation." },
      { status: 500 },
    );
  }
}
