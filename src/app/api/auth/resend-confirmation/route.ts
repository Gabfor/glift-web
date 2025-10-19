import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getSiteOrigin } from "@/lib/url/getSiteOrigin";

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

    if (!email) {
      console.warn(
        "[resend-confirmation] Authenticated user does not have an email address",
      );
      return NextResponse.json(
        { error: "Adresse email introuvable pour l'utilisateur." },
        { status: 400 },
      );
    }

    const fallbackOrigin = request.nextUrl.origin;
    const siteOrigin =
      getSiteOrigin(fallbackOrigin) ?? request.headers.get("origin") ?? fallbackOrigin;
    const emailRedirectTo = new URL("/auth/callback", siteOrigin).toString();

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
      try {
        const adminClient = createAdminClient();
        const {
          data: adminResendData,
          error: adminResendError,
        } = await adminClient.auth.resend({
          type: "signup",
          email,
          options: { emailRedirectTo },
        } as Parameters<typeof adminClient.auth.resend>[0]);

        if (adminResendError) {
          console.error(
            "[resend-confirmation] Admin client also failed to resend confirmation email",
            adminResendError,
          );
        } else if (!adminResendData) {
          console.warn(
            "[resend-confirmation] Admin client resend succeeded but returned no data",
          );
        } else {
          return NextResponse.json({ success: true });
        }
      } catch (adminClientError) {
        console.error(
          "[resend-confirmation] Unable to create admin client for resend fallback",
          adminClientError,
        );
      }
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
