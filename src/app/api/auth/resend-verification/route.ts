import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { EmailService } from "@/lib/services/emailService";
import { getAbsoluteUrl } from "@/lib/url";

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();

        // 1. Check if user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        if (!user.email) {
            return NextResponse.json({ error: "Email introuvable" }, { status: 400 });
        }

        // Check verification status in PROFILES table (because auth.users.email_confirmed_at is true by default with Option A)
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("email_verified")
            .eq("id", user.id)
            .single();

        if (profileError) {
            console.error("Error checking profile:", profileError);
            // Fail safe: proceed if we can't check, or block? Let's block to avoid spam if error.
            return NextResponse.json({ error: "Erreur lors de la vérification du profil" }, { status: 500 });
        }

        if (profile?.email_verified) {
            return NextResponse.json({ error: "Email déjà vérifié" }, { status: 400 });
        }

        // 2. Prepare callback URL
        const callbackUrl = getAbsoluteUrl("/auth/callback", req.nextUrl.origin);
        const callbackUrlWithEmail = new URL(callbackUrl);
        callbackUrlWithEmail.searchParams.set("email", user.email);
        const emailRedirectTo = callbackUrlWithEmail.toString();

        // 3. Generate Magic Link via Admin
        const adminClient = createAdminClient();
        const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
            type: "magiclink",
            email: user.email,
            options: {
                redirectTo: emailRedirectTo,
            },
        });

        if (linkError) {
            console.error("Error generating magic link for resend:", linkError);
            return NextResponse.json({ error: "Erreur lors de la génération du lien" }, { status: 500 });
        }

        if (!linkData?.properties?.action_link) {
            return NextResponse.json({ error: "Impossible de récupérer le lien" }, { status: 500 });
        }

        // 4. Send Email via EmailService
        const emailService = new EmailService();
        await emailService.sendVerificationEmail(user.email, linkData.properties.action_link);

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Unexpected error in resend-verification:", error);
        return NextResponse.json(
            { error: error.message || "Une erreur interne est survenue." },
            { status: 500 }
        );
    }
}
