import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    let supabaseAdmin: ReturnType<typeof createAdminClient> | null = null;

    const ensureAdminClient = () => {
      if (supabaseAdmin) {
        return supabaseAdmin;
      }

      supabaseAdmin = createAdminClient();
      return supabaseAdmin;
    };
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

    // 🔑 Connexion automatique juste après
    const { error: signinError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    const emailNotConfirmed =
      Boolean(signinError?.message) &&
      signinError.message.toLowerCase().includes("email not confirmed");

    if (emailNotConfirmed) {
      try {
        const adminClient = ensureAdminClient();
        const { data: adminSigninData, error: adminSigninError } =
          await adminClient.auth.signInWithPassword({ email, password });

        if (adminSigninError) {
          console.error(
            "Connexion admin impossible pour contourner la confirmation email",
            adminSigninError,
          );
        } else if (adminSigninData.session) {
          await supabase.auth.setSession(adminSigninData.session);
        }
      } catch (adminSigninException) {
        console.error(
          "Impossible de créer le client admin Supabase",
          adminSigninException,
        );
        return NextResponse.json(
          { error: "Configuration Supabase incomplète." },
          { status: 500 },
        );
      }
    }

    if (signinError && !emailNotConfirmed) {
      return NextResponse.json({ error: signinError.message }, { status: 400 });
    }

    const userId = signupData?.user?.id;

    if (userId) {
      try {
        const adminClient = ensureAdminClient();

        const {
          data: existingProfile,
          error: profileLookupError,
        } = await adminClient
          .from("profiles")
          .select("id")
          .eq("id", userId)
          .maybeSingle();

        if (profileLookupError) {
          console.error("Lecture du profil impossible", profileLookupError);
          return NextResponse.json(
            { error: "Création du profil utilisateur impossible." },
            { status: 400 },
          );
        }

        if (!existingProfile) {
          const { error: profileInsertError } = await adminClient
            .from("profiles")
            .insert({
              id: userId,
              name,
            });

          if (profileInsertError) {
            console.error(
              "Insertion du profil impossible",
              profileInsertError,
            );
            return NextResponse.json(
              { error: "Création du profil utilisateur impossible." },
              { status: 400 },
            );
          }
        }

        const {
          data: existingSubscription,
          error: subscriptionLookupError,
        } = await adminClient
          .from("user_subscriptions")
          .select("user_id")
          .eq("user_id", userId)
          .maybeSingle();

        if (subscriptionLookupError) {
          console.error(
            "Lecture de l'abonnement impossible",
            subscriptionLookupError,
          );
          return NextResponse.json(
            { error: "Création de l'abonnement impossible." },
            { status: 400 },
          );
        }

        const mutation = existingSubscription ? "update" : "insert";
        const { error: subscriptionError } = existingSubscription
          ? await adminClient
              .from("user_subscriptions")
              .update({ plan: supabasePlan })
              .eq("user_id", userId)
          : await adminClient
              .from("user_subscriptions")
              .insert({ user_id: userId, plan: supabasePlan });

        if (subscriptionError) {
          console.error(
            `Erreur ${mutation} abonnement`,
            subscriptionError,
          );

          return NextResponse.json(
            { error: "Création de l'abonnement impossible." },
            { status: 400 },
          );
        }
      } catch (creationError) {
        console.error(
          "Impossible de créer le client admin Supabase",
          creationError,
        );
        return NextResponse.json(
          { error: "Configuration Supabase incomplète." },
          { status: 500 },
        );
      }
    }

    // ✅ Succès : le frontend peut rediriger vers /entrainements
    return NextResponse.json({
      success: true,
      requiresEmailConfirmation: emailNotConfirmed,
    });
  } catch (unhandledError) {
    console.error("Erreur inattendue lors de l'inscription", unhandledError);
    return NextResponse.json(
      { error: "Une erreur interne est survenue." },
      { status: 500 }
    );
  }
}
