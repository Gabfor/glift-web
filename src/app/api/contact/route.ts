import { NextResponse } from "next/server";
import { EmailService } from "@/lib/services/emailService";
import { SettingsService } from "@/lib/services/settingsService";
import { checkRateLimit, getClientIp } from "@/lib/rateLimiter";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
    try {
        // 1. Rate Limiting check (5 requests per 10 minutes per IP)
        const clientIp = getClientIp(req);
        const rateLimit = checkRateLimit(`contact:${clientIp}`, 5, 600000);
        if (!rateLimit.allowed) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Trop de tentatives d'envoi. Merci de patienter quelques minutes avant de réessayer.",
                },
                { status: 429 }
            );
        }

        const { email, subject, description, fileUrls, turnstileToken } = await req.json();

        // 2. Cloudflare Turnstile verification
        const turnstileResult = await verifyTurnstileToken(turnstileToken, clientIp);
        if (!turnstileResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: turnstileResult.error || "Validation de sécurité échouée. Merci de recharger la page et de réessayer.",
                },
                { status: 403 }
            );
        }

        // 3. Field validations
        if (!email || !subject || !description) {
            return NextResponse.json(
                { success: false, error: "Tous les champs (email, sujet, description) sont obligatoires." },
                { status: 400 }
            );
        }

        if (fileUrls && Array.isArray(fileUrls) && fileUrls.length > 5) {
            return NextResponse.json(
                { success: false, error: "Vous ne pouvez pas envoyer plus de 5 pièces jointes." },
                { status: 400 }
            );
        }

        // 4. Initialize admin client to read settings safely
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        const settingsService = new SettingsService(supabaseAdmin as any);

        // 5. Fetch destination email from settings
        const destinationEmail = await settingsService.getSetting("contact_email");

        if (!destinationEmail) {
            console.error("No contact_email configured in admin settings.");
            return NextResponse.json(
                { success: false, error: "The contact system is currently unavailable (missing configuration)." },
                { status: 500 }
            );
        }

        // 6. Send the email
        const emailService = new EmailService();
        await emailService.sendContactEmail(destinationEmail, email, subject, description, fileUrls);

        return NextResponse.json({ success: true, message: "Email sent successfully" });
    } catch (error: any) {
        console.error("Error in /api/contact:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Une erreur interne est survenue" },
            { status: 500 }
        );
    }
}
