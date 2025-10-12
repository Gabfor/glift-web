import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error("Impossible de récupérer l'utilisateur pour le renvoi", userError);
    return NextResponse.json(
      { error: "Impossible de récupérer l'utilisateur." },
      { status: 500 },
    );
  }

  if (!user || !user.email) {
    return NextResponse.json(
      { error: "Utilisateur non authentifié." },
      { status: 401 },
    );
  }

  if (user.email_confirmed_at) {
    return NextResponse.json(
      { error: "Votre adresse email est déjà vérifiée." },
      { status: 400 },
    );
  }

  const { error: resendError } = await supabase.auth.resend({
    type: "signup",
    email: user.email,
  });

  if (resendError) {
    console.error("Renvoi d'email de vérification impossible", resendError);

    let message = "Impossible d'envoyer l'email de vérification.";

    if (resendError.status === 429) {
      message =
        "Vous avez demandé trop de renvois d'email. Patientez quelques minutes avant de réessayer.";
    } else if (resendError.message) {
      message = resendError.message;
    }

    return NextResponse.json(
      { error: message },
      { status: resendError.status ?? 400 },
    );
  }

  return NextResponse.json({ success: true });
}
