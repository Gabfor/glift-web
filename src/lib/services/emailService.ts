import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export class EmailService {
    async sendVerificationEmail(email: string, link: string) {
        // In dev mode or if no API key, log the link
        if (!process.env.RESEND_API_KEY) {
            console.log("----------------------------------------");
            console.log("📧 [EmailService] Verification Link:");
            console.log(`To: ${email}`);
            console.log(`Link: ${link}`);
            console.log("----------------------------------------");
            return;
        }

        try {
            const { data, error } = await resend.emails.send({
                from: "Glift <onboarding@resend.dev>", // TODO: Replace with your verified domain in production
                to: email,
                subject: "Confirmez votre inscription sur Glift",
                html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2E3271;">Bienvenue sur Glift !</h1>
            <p style="color: #5D6494; font-size: 16px;">
              Merci de vous être inscrit. Pour confirmer que cette adresse email vous appartient, veuillez cliquer sur le lien ci-dessous :
            </p>
            <div style="margin: 30px 0;">
              <a href="${link}" style="background-color: #7069FA; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Confirmer mon email
              </a>
            </div>
            <p style="color: #9CA3AF; font-size: 14px;">
              Si le bouton ne fonctionne pas, vous pouvez copier ce lien : <br>
              <a href="${link}" style="color: #7069FA;">${link}</a>
            </p>
          </div>
        `,
            });

            if (error) {
                console.error("Error sending verification email via Resend:", error);
                throw new Error("Failed to send verification email");
            }

            return data;
        } catch (error) {
            console.error("EmailService error:", error);
            // Don't block flow if email fails, but log it
        }
    }
}
