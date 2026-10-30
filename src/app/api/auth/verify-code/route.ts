import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { SubscriptionService } from "@/lib/services/subscriptionService";
import { UserService } from "@/lib/services/userService";
import { PaymentService } from "@/lib/services/paymentService";
import { getAbsoluteUrl } from "@/lib/url";
import { decryptPayload } from "@/lib/otpToken";
import { checkRateLimit, getClientIp } from "@/lib/rateLimiter";

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const ipLimit = checkRateLimit(`verify-code:ip:${clientIp}`, 10, 600000);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: "Trop de tentatives de validation. Merci de patienter quelques minutes avant de réessayer." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { code, token } = body;

    // 1. Validation
    if (!code || !token) {
      return NextResponse.json({ error: "Champs manquants." }, { status: 400 });
    }

    // 2. Decrypt and validate token
    const payload = decryptPayload(token);
    if (!payload) {
      return NextResponse.json({ error: "Session d'inscription invalide ou expirée." }, { status: 400 });
    }

    const { name, email, password, plan, code: expectedCode, expiresAt } = payload;

    // Check expiration
    if (Date.now() > expiresAt) {
      return NextResponse.json({ error: "Le code de validation a expiré." }, { status: 400 });
    }

    // Check code match
    if (code !== expectedCode) {
      return NextResponse.json({ error: "Le code de validation est incorrect." }, { status: 400 });
    }

    // 3. User is verified! Proceed with Supabase registration
    const supabase = await createClient();
    const callbackUrl = getAbsoluteUrl("/auth/callback", req.nextUrl.origin);
    const callbackUrlWithEmail = new URL(callbackUrl);
    callbackUrlWithEmail.searchParams.set("email", email);
    const emailRedirectTo = callbackUrlWithEmail.toString();

    const supabasePlan = plan === "premium" ? "premium" : "starter";

    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
        data: {
          name,
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

    // 4. Initialisation des données (Profil, Abonnements...) via Admin Client
    const adminClient = createAdminClient();
    const userService = new UserService(adminClient);
    const subscriptionService = new SubscriptionService(adminClient);
    const paymentService = new PaymentService(adminClient);

    try {
      // Exécution séquentielle pour garantir que le profil existe (contrainte FK)
      await userService.createOrUpdateProfile(userId, { name, plan: supabasePlan });
      
      // Set email_verified to true immediately since they validated the code
      await adminClient.from("profiles").update({ email_verified: true }).eq("id", userId);

      // Ensuite, on peut lancer le reste en parallèle
      await Promise.all([
        userService.initializePreferences(userId),
        subscriptionService.initializeSubscription(userId, supabasePlan),
        paymentService.createCustomerAndStarterSubscription(userId, email, name, plan as 'starter' | 'premium'),
      ]);

    } catch (serviceError: any) {
      console.error("Erreur initialisation post-inscription:", serviceError);
    }

    // ✅ Succès
    return NextResponse.json({
      success: true,
      requiresEmailConfirmation: false,
      session: session,
    });

  } catch (err) {
    console.error("Unexpected error in verify-code route:", err);
    return NextResponse.json(
      { error: "Une erreur interne est survenue." },
      { status: 500 }
    );
  }
}
