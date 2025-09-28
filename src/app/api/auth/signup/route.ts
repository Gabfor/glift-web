import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const body = await req.json();

    const { email, password, name, plan } = body;

    // 🔒 Vérifie les champs requis
    if (!email || !password || !name || !plan) {
      return NextResponse.json({ error: "Champs manquants." }, { status: 400 });
    }

    if (plan !== "starter" && plan !== "premium") {
      return NextResponse.json({ error: "Formule d'abonnement invalide." }, { status: 400 });
    }

    // 📝 Inscription Supabase
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          subscription_plan: plan,
          is_premium: plan === "premium",
        },
      },
    });

    if (signupError) {
      return NextResponse.json({ error: signupError.message }, { status: 400 });
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

      const { error: subscriptionError } = await supabaseAdmin
        .from("user_subscriptions")
        .upsert(
          {
            user_id: userId,
            plan,
          },
          { onConflict: "user_id" }
        );
  if (userId) {
    const supabaseAdmin = createAdminClient();
    const { error: subscriptionError } = await supabaseAdmin
      .from("user_subscriptions")
      .upsert(
        {
          user_id: userId,
          plan,
        },
        { onConflict: "user_id" }
      );

      if (subscriptionError) {
        console.error("Erreur enregistrement abonnement", subscriptionError);
        return NextResponse.json(
          { error: "Création de l'abonnement impossible." },
          { status: 400 }
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
