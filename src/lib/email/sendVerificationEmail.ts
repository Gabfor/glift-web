type SendVerificationEmailParams = {
  to: string;
  verificationLink: string;
  name?: string;
};

const RESEND_ENDPOINT = "https://api.resend.com/emails";

function buildEmailContent({
  verificationLink,
  name,
}: Pick<SendVerificationEmailParams, "verificationLink" | "name">) {
  const greeting = name?.trim()
    ? `Bonjour ${name.trim()},`
    : "Bonjour,";

  const previewText =
    "Confirmez votre adresse e-mail pour activer toutes les fonctionnalités Glift.";

  const html = `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Confirmez votre adresse e-mail</title>
  </head>
  <body style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f8f9ff; padding: 24px; color: #1f1f3d;">
    <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 12px 32px rgba(46, 50, 113, 0.12);">
      <p style="font-size: 16px; margin: 0 0 16px; color: #6b6e8f;">${previewText}</p>
      <h1 style="font-size: 24px; margin: 0 0 24px; color: #2e3271;">Confirmez votre adresse e-mail</h1>
      <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px;">${greeting}</p>
      <p style="font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
        Cliquez sur le bouton ci-dessous pour vérifier votre adresse e-mail et activer votre compte Glift.
      </p>
      <p style="text-align: center; margin: 0 0 32px;">
        <a href="${verificationLink}" style="display: inline-block; background-color: #7069fa; color: #ffffff; text-decoration: none; font-weight: 600; padding: 14px 28px; border-radius: 9999px;">Confirmer mon e-mail</a>
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #6b6e8f; margin: 0 0 16px;">
        Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur&nbsp;:<br />
        <a href="${verificationLink}" style="color: #7069fa; word-break: break-all;">${verificationLink}</a>
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #6b6e8f; margin: 0;">
        À bientôt,<br />
        L'équipe Glift
      </p>
    </div>
    <p style="max-width: 520px; margin: 16px auto 0; font-size: 12px; color: #8c91b6; text-align: center;">
      Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet e-mail.
    </p>
  </body>
</html>`;

  const text = `${greeting}

Confirmez votre adresse e-mail pour activer votre compte Glift.

Confirmer mon e-mail : ${verificationLink}

Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.

L'équipe Glift`;

  return { html, text };
}

export async function sendVerificationEmail({
  to,
  verificationLink,
  name,
}: SendVerificationEmailParams) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;

  if (!apiKey || !from) {
    throw new Error("Resend configuration is missing");
  }

  const { html, text } = buildEmailContent({
    verificationLink,
    name,
  });

  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Confirmez votre adresse e-mail",
      html,
      text,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      `Resend API responded with ${response.status}: ${message || "Unknown error"}`,
    );
  }

  return response.json().catch(() => null);
}

