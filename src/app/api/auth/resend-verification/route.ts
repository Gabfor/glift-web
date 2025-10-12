import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
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

  const { error: resendError } = await supabase.auth.resend({
    type: "signup",
    email: user.email,
  });

  if (resendError) {
    return NextResponse.json(
      { error: "Impossible d'envoyer l'email de vérification." },
      { status: 400 },
    );
  }

  return NextResponse.json({ success: true });
}
