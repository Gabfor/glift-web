import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { SubscriptionService } from "@/lib/services/subscriptionService";
import { UserService } from "@/lib/services/userService";
import { EmailService } from "@/lib/services/emailService";
import { PaymentService } from "@/lib/services/paymentService";
import { getAbsoluteUrl } from "@/lib/url";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await req.json();

    const { email, password, name, plan, stripe_customer_id, stripe_subscription_id } = body;

    // 🔒 Validation
    if (!email || !password || !name || !plan) {
      return NextResponse.json({ error: "Champs manquants." }, { status: 400 });
    }

    if (plan !== "starter" && plan !== "premium") {
      return NextResponse.json({ error: "Formule d'abonnement invalide." }, { status: 400 });
    }

    const callbackUrl = getAbsoluteUrl("/auth/callback", req.nextUrl.origin);
    const callbackUrlWithEmail = new URL(callbackUrl);
    callbackUrlWithEmail.searchParams.set("email", email);
    const emailRedirectTo = callbackUrlWithEmail.toString();

    // We now use "starter" consistently.
    // Even if they selected "premium" in the UI, they are "starter" until they pay.
    const supabasePlan = "starter";

    // 📝 Inscription Supabase
    // Note: Option "Confirm email" disabled in Supabase project settings is REQUIRED for this to work
    // without manual email validation steps.
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
        data: {
          name,
          // We don't store plan in metadata anymore
        },
      },
    });

    if (signupError) {
      return NextResponse.json({ error: signupError.message }, { status: 400 });
    }

    if (signupData?.user?.identities?.length === 0) {
      return NextResponse.json(
        { error: "Cette adresse email est déjà utilisée." },
        { status: 400 }
      );
    }

    const userId = signupData.user?.id;
    const session = signupData.session;

    if (!userId) {
      return NextResponse.json(
        { error: "Erreur lors de la création de l'utilisateur." },
        { status: 500 }
      );
    }

    // ⚙️ Initialisation des données (Profil, Abonnements...) via Admin Client
    const adminClient = createAdminClient();
    const userService = new UserService(adminClient);
    const subscriptionService = new SubscriptionService(adminClient);
    const paymentService = new PaymentService(adminClient);
    const emailService = new EmailService();

    try {
      // Exécution séquentielle pour garantir que le profil existe (contrainte FK)
      await userService.createOrUpdateProfile(userId, { name, plan: supabasePlan });

      // Ensuite, on peut lancer le reste en parallèle
      await Promise.all([
        userService.initializePreferences(userId),
        subscriptionService.initializeSubscription(userId, supabasePlan),
        // Create Stripe Customer and Starter Subscription
        paymentService.createCustomerAndStarterSubscription(userId, email, name),
      ]);

      // 📧 Envoi de l'email de confirmation (Non-bloquant)
      // Génération du lien magique via admin
      const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
        type: "magiclink",
        email: email,
        options: {
          redirectTo: emailRedirectTo,
        },
      });

      if (linkError) {
        console.error("Erreur génération lien magique:", linkError);
      } else if (linkData?.properties?.action_link) {
        // On ne "await" pas forcément l'envoi pour ne pas ralentir la réponse,
        // mais pour la fiabilité on peut le faire ou le mettre en tâche de fond.
        // Ici on await pour simplifier et logger si erreur.
        await emailService.sendVerificationEmail(email, linkData.properties.action_link);
      }

    } catch (serviceError: any) {
      console.error("Erreur initialisation post-inscription:", serviceError);
    }

    // ✅ Succès
    return NextResponse.json({
      success: true,
      requiresEmailConfirmation: false,
      session: session,
    });

  } catch (unhandledError) {
    console.error("Erreur inattendue lors de l'inscription", unhandledError);
    return NextResponse.json(
      { error: "Une erreur interne est survenue." },
      { status: 500 }
    );
  }
}
