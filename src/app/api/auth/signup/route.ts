import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { getAbsoluteUrl } from "@/lib/env";

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
    const redirectParams = new URLSearchParams({ plan, origin: "signup" });
    const redirectTarget = getAbsoluteUrl(
      `/inscription/informations?${redirectParams.toString()}`,
    );

    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          subscription_plan: supabasePlan,
          is_premium: supabasePlan === "premium",
        },
        emailRedirectTo: redirectTarget,
      },
    });

    if (signupError) {
      return NextResponse.json({ error: signupError.message }, { status: 400 });
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
    }

    const requiresEmailConfirmation = !signupData?.session;

    // ✅ Succès : le frontend peut rediriger vers /entrainements ou inviter à vérifier l'email
    return NextResponse.json({ success: true, requiresEmailConfirmation });
  } catch (unhandledError) {
    console.error("Erreur inattendue lors de l'inscription", unhandledError);
    return NextResponse.json(
      { error: "Une erreur interne est survenue." },
      { status: 500 }
    );
  }
}
