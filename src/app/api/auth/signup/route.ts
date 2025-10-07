import { NextRequest, NextResponse } from "next/server";
import { addDays } from "date-fns";

import { createAdminClient, createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await req.json();

    const { email, password, name, plan } = body;

    // 🔒 Vérifie les champs requis
    if (!email || !password || !name || !plan) {
      return NextResponse.json({ error: "Champs manquants." }, { status: 400 });
    }

    if (plan !== "starter" && plan !== "premium") {
      return NextResponse.json({ error: "Formule d'abonnement invalide." }, { status: 400 });
    }

    const supabasePlan = plan === "starter" ? "basic" : "premium";

    // 📝 Inscription Supabase
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          subscription_plan: supabasePlan,
          is_premium: supabasePlan === "premium",
        },
      },
    });

    if (signupError) {
      return NextResponse.json({ error: signupError.message }, { status: 400 });
    }

    if (!signupData?.user?.email_confirmed_at) {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
      });

      if (resendError) {
        console.error(
          "Envoi initial de l'email de vérification impossible",
          resendError,
        );
      }
    }

    // 🔑 Connexion automatique juste après
    const { error: signinError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signinError) {
      return NextResponse.json({ error: signinError.message }, { status: 400 });
    }

    const userId = signupData?.user?.id;

    if (userId) {
      const verificationSentAt = new Date();
      const verificationDeadline = addDays(verificationSentAt, 7);

      let supabaseAdmin: ReturnType<typeof createAdminClient>;
      try {
        supabaseAdmin = createAdminClient();
      } catch (creationError) {
        console.error(
          "Impossible de créer le client admin Supabase",
          creationError
        );
        return NextResponse.json(
          { error: "Configuration Supabase incomplète." },
          { status: 500 }
        );
      }

      const {
        data: existingSubscription,
        error: subscriptionLookupError,
      } = await supabaseAdmin
        .from("user_subscriptions")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle();

      if (subscriptionLookupError) {
        console.error(
          "Lecture de l'abonnement impossible",
          subscriptionLookupError
        );
        return NextResponse.json(
          { error: "Création de l'abonnement impossible." },
          { status: 400 }
        );
      }

      const mutation = existingSubscription ? "update" : "insert";
      const { error: subscriptionError } = existingSubscription
        ? await supabaseAdmin
            .from("user_subscriptions")
            .update({ plan: supabasePlan })
            .eq("user_id", userId)
        : await supabaseAdmin
            .from("user_subscriptions")
            .insert({ user_id: userId, plan: supabasePlan });

      if (subscriptionError) {
        console.error(
          `Erreur ${mutation} abonnement`,
          subscriptionError
        );

        return NextResponse.json(
          { error: "Création de l'abonnement impossible." },
          { status: 400 }
        );
      }

      const nextMetadata = {
        ...(signupData.user?.user_metadata as Record<string, unknown>),
        email_verification_sent_at: verificationSentAt.toISOString(),
        email_verification_deadline: verificationDeadline.toISOString(),
      } satisfies Record<string, unknown>;

      const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        {
          user_metadata: nextMetadata,
        },
      );

      if (metadataError) {
        console.error(
          "Mise à jour des métadonnées de vérification impossible",
          metadataError,
        );
      }

      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .upsert(
          {
            id: userId,
            email_verified: false,
            email_verification_sent_at: verificationSentAt.toISOString(),
            email_verification_deadline: verificationDeadline.toISOString(),
          },
          { onConflict: "id" },
        );

      if (profileError) {
        console.error(
          "Mise à jour du profil de vérification impossible",
          profileError,
        );
      }
    }

    // ✅ Succès : le frontend peut rediriger vers /entrainements
    return NextResponse.json({ success: true });
  } catch (unhandledError) {
    console.error("Erreur inattendue lors de l'inscription", unhandledError);
    return NextResponse.json(
      { error: "Une erreur interne est survenue." },
      { status: 500 }
    );
  }
}
