import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { createProvisionalSession } from "@/lib/auth/provisionalSession";

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
    let sessionTokens: { access_token: string; refresh_token: string } | null =
      null;

    const { data: signinData, error: signinError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (signinData?.session) {
      sessionTokens = {
        access_token: signinData.session.access_token,
        refresh_token: signinData.session.refresh_token,
      };
    }

    const emailNotConfirmed =
      Boolean(signinError?.message) &&
      signinError.message.toLowerCase().includes("email not confirmed");

    if (emailNotConfirmed) {
      try {
        const adminClient = ensureAdminClient();
        const { data: adminSigninData, error: adminSigninError } =
          await adminClient.auth.signInWithPassword({ email, password });

        if (adminSigninError) {
          if (adminSigninError.code === "email_not_confirmed") {
            console.info(
              "Connexion admin bloquée par confirmation email, poursuite sans session",
            );
          } else {
            console.error(
              "Connexion admin impossible pour contourner la confirmation email",
              adminSigninError,
            );

            return NextResponse.json(
              {
                error:
                  "Connexion impossible après la création du compte. Merci de réessayer.",
              },
              { status: 500 },
            );
          }
        } else if (adminSigninData.session) {
          const adminSession = adminSigninData.session;
          const { error: setSessionError } = await supabase.auth.setSession({
            access_token: adminSession.access_token,
            refresh_token: adminSession.refresh_token,
          });

          if (setSessionError) {
            console.error(
              "Echec du placement de session suite à la connexion admin",
              setSessionError,
            );

            return NextResponse.json(
              {
                error:
                  "Connexion impossible après la création du compte. Merci de réessayer.",
              },
              { status: 500 },
            );
          }

          sessionTokens = {
            access_token: adminSession.access_token,
            refresh_token: adminSession.refresh_token,
          };
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
          .select("id, email_verified")
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
              email_verified: false,
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
        } else {
          const profileUpdatePayload: {
            name: string;
            email_verified?: boolean;
          } = {
            name,
          };

          if (existingProfile.email_verified !== false) {
            profileUpdatePayload.email_verified = false;
          }

          const { error: profileUpdateError } = await adminClient
            .from("profiles")
            .update(profileUpdatePayload)
            .eq("id", userId);

          if (profileUpdateError) {
            console.error(
              "Mise à jour du profil impossible",
              profileUpdateError,
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

    if (!sessionTokens && email && password) {
      try {
        const adminClient = ensureAdminClient();
        const provisionalResult = await createProvisionalSession(
          adminClient,
          { email, password },
        );

        if ("sessionTokens" in provisionalResult) {
          sessionTokens = provisionalResult.sessionTokens;
        } else {
          console.warn(
            "Création de session provisoire impossible après inscription",
            provisionalResult,
          );
        }
      } catch (provisionalError) {
        console.error(
          "Impossible d'initialiser une session provisoire post-inscription",
          provisionalError,
        );
      }
    }

    if (emailNotConfirmed && userId) {
      try {
        const adminClient = ensureAdminClient();
        const { error: resetEmailVerifiedError } = await adminClient
          .from("profiles")
          .update({ email_verified: false })
          .eq("id", userId);

        if (resetEmailVerifiedError) {
          console.error(
            "Impossible de réinitialiser l'état de vérification email du profil",
            resetEmailVerifiedError,
          );
        }
      } catch (resetEmailVerifiedException) {
        console.error(
          "Réinitialisation de l'état de vérification email échouée",
          resetEmailVerifiedException,
        );
      }
    }

    // ✅ Succès : le frontend peut rediriger vers /entrainements
    return NextResponse.json({
      success: true,
      requiresEmailConfirmation: emailNotConfirmed,
      session: sessionTokens,
    });
  } catch (unhandledError) {
    console.error("Erreur inattendue lors de l'inscription", unhandledError);
    return NextResponse.json(
      { error: "Une erreur interne est survenue." },
      { status: 500 }
    );
  }
}
