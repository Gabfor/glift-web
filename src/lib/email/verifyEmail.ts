import { Resend } from "resend";
import { getServiceRoleClient } from "@/lib/supabase/serviceRole";

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
}

function renderHtml(link: string) {
  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:16px;color:#1f2937;">
    <h2>Bienvenue sur Glift 👋</h2>
    <p>Clique sur le bouton pour confirmer ton email :</p>
    <p>
      <a href="${link}" style="display:inline-block;background:#7069FA;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">
        Confirmer mon email
      </a>
    </p>
    <p style="font-size:12px;color:#6b7280">Ou copie-colle ce lien :<br/>${link}</p>
  </div>`;
}

export async function sendVerificationEmail({ email, token }: { email: string; token: string }) {
  const RESEND_KEY = process.env.RESEND_API_KEY;
  const RESEND_FROM = process.env.RESEND_FROM || "Glift <no-reply@glift.io>";

  const admin = getServiceRoleClient();

  const confirmApi = `/api/email/confirm?token=${encodeURIComponent(token)}&dest=${encodeURIComponent("/compte#mes-informations")}`;
  const redirectTo = `${siteUrl()}/auth/callback?next=${encodeURIComponent(confirmApi)}`;

  const { data } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo },
  });

  const actionLink = data?.properties?.action_link || `${siteUrl()}${confirmApi}`;

  if (!RESEND_KEY) {
    console.log("[verifyEmail][DEV] Magic link:", actionLink);
    return { sent: false, url: actionLink };
  }

  const resend = new Resend(RESEND_KEY);
  await resend.emails.send({
    from: RESEND_FROM,
    to: email,
    subject: "Confirme ton email",
    html: renderHtml(actionLink),
    text: `Confirme ton email : ${actionLink}`,
  });

  return { sent: true, url: actionLink };
}
