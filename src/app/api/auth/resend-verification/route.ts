import { NextResponse } from "next/server";

import { createAdminClient, createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("Impossible de récupérer l'utilisateur courant", userError);
      return NextResponse.json(
        { error: "Utilisateur introuvable." },
        { status: 401 },
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
      console.error("Renvoi de l'email de vérification impossible", resendError);
      return NextResponse.json(
        { error: "Renvoi du mail impossible." },
        { status: 400 },
      );
    }

    try {
      const admin = createAdminClient();
      const metadata = {
        ...(user.user_metadata as Record<string, unknown>),
        email_verification_sent_at: new Date().toISOString(),
      } satisfies Record<string, unknown>;

      await admin.auth.admin.updateUserById(user.id, {
        user_metadata: metadata,
      });

      const { error: profileUpdateError } = await admin
        .from("profiles")
        .update({
          email_verification_sent_at: metadata.email_verification_sent_at,
        })
        .eq("id", user.id);

      if (profileUpdateError) {
        console.error(
          "Mise à jour du profil après renvoi de l'email impossible",
          profileUpdateError,
        );
      }
    } catch (metadataError) {
      console.error(
        "Mise à jour des métadonnées de vérification impossible",
        metadataError,
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(
      "Erreur inattendue lors du renvoi de l'email de vérification",
      error,
    );
    return NextResponse.json(
      {
        error: "Une erreur est survenue lors de l'envoi du mail de vérification.",
      },
      { status: 500 },
    );
  }
}
