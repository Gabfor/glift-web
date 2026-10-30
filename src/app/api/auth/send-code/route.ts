import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { EmailService } from "@/lib/services/emailService";
import { encryptPayload } from "@/lib/otpToken";
import { checkRateLimit, getClientIp } from "@/lib/rateLimiter";

export async function POST(req: NextRequest) {
  try {
    // 0. Rate limiting by IP and email
    const clientIp = getClientIp(req);
    const ipLimit = checkRateLimit(`send-code:ip:${clientIp}`, 10, 600000);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: "Trop de demandes de code. Merci de patienter quelques minutes avant de réessayer." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { email, password, name, plan } = body;

    // 1. Validation
    if (!email || !password || !name || !plan) {
      return NextResponse.json({ error: "Champs manquants." }, { status: 400 });
    }

    if (plan !== "starter" && plan !== "premium") {
      return NextResponse.json({ error: "Formule d'abonnement invalide." }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Rate limiting per target email (max 5 requests per 10 minutes)
    const emailLimit = checkRateLimit(`send-code:email:${normalizedEmail}`, 5, 600000);
    if (!emailLimit.allowed) {
      return NextResponse.json(
        { error: "Trop de demandes de code pour cette adresse email. Merci de patienter quelques minutes avant de réessayer." },
        { status: 429 }
      );
    }

    // 2. Check if email already exists
    const adminClient = createAdminClient();
    
    let emailExists = false;
    let page = 1;
    const perPage = 100;

    while (true) {
      const { data, error: listError } = await adminClient.auth.admin.listUsers({
        page,
        perPage,
      });

      if (listError) {
        console.error("Error listing users to check existence:", listError);
        return NextResponse.json({ error: "Erreur lors de la vérification de l'adresse email." }, { status: 500 });
      }

      const users = data?.users ?? [];
      if (users.length === 0) break;

      const matchedUser = users.find((candidate) => {
        const candidateEmail = candidate.email?.toLowerCase();
        const candidateNewEmail = candidate.new_email?.toLowerCase();
        return (
          candidateEmail === normalizedEmail ||
          candidateNewEmail === normalizedEmail
        );
      });

      if (matchedUser) {
        emailExists = true;
        break;
      }

      if (users.length < perPage) break;
      page++;
    }

    if (emailExists) {
      return NextResponse.json(
        { error: "Cette adresse email est déjà utilisée." },
        { status: 400 }
      );
    }

    // 3. Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // 4. Send the OTP by email
    const emailService = new EmailService();
    await emailService.sendOTPCodeEmail(normalizedEmail, code);

    // 5. Encrypt details into token
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes validity
    const payload = {
      name: name.trim(),
      email: normalizedEmail,
      password,
      plan,
      code,
      expiresAt,
    };

    const token = encryptPayload(payload);

    return NextResponse.json({
      success: true,
      token,
    });

  } catch (err) {
    console.error("Unexpected error in send-code route:", err);
    return NextResponse.json(
      { error: "Une erreur interne est survenue." },
      { status: 500 }
    );
  }
}
