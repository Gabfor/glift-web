import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: getUserError,
    } = await supabase.auth.getUser();

    if (getUserError) {
      console.error(
        "[resend-verification-email] Unable to retrieve the authenticated user",
        getUserError,
      );
      return NextResponse.json(
        { error: "Session utilisateur introuvable." },
        { status: 401 },
      );
    }

    const email = user?.email?.trim();

    if (!email) {
      console.error(
        "[resend-verification-email] Missing email on the authenticated user",
      );
      return NextResponse.json(
        {
          error: "Adresse email indisponible pour l'utilisateur connecté.",
        },
        { status: 400 },
      );
    }

    const emailRedirectTo = new URL(
      "/auth/callback",
      req.nextUrl.origin,
    ).toString();

    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo },
    });

    if (resendError) {
      console.error(
        "[resend-verification-email] Unable to resend the verification email",
        resendError,
      );
      return NextResponse.json(
        {
          error: "L'envoi de l'email de vérification a échoué.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(
      "[resend-verification-email] Unexpected error while resending the verification email",
      error,
    );
    return NextResponse.json(
      {
        error: "Erreur inattendue lors du renvoi de l'email de vérification.",
      },
      { status: 500 },
    );
  }
}
