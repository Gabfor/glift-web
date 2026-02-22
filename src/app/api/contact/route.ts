import { NextResponse } from "next/server";
import { EmailService } from "@/lib/services/emailService";
import { SettingsService } from "@/lib/services/settingsService";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
    try {
        const { email, subject, description, fileUrls } = await req.json();

        if (!email || !subject || !description) {
            return NextResponse.json(
                { success: false, error: "Tous les champs (email, sujet, description) sont obligatoires." },
                { status: 400 }
            );
        }

        // Initialize admin client to read settings safely
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        const settingsService = new SettingsService(supabaseAdmin as any);

        // Fetch destination email from settings
        const destinationEmail = await settingsService.getSetting("contact_email");

        if (!destinationEmail) {
            console.error("No contact_email configured in admin settings.");
            return NextResponse.json(
                { success: false, error: "The contact system is currently unavailable (missing configuration)." },
                { status: 500 }
            );
        }

        // Send the email
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
