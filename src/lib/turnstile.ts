/**
 * Cloudflare Turnstile Server-Side Validation
 */

const DUMMY_SECRET_KEY = "1x0000000000000000000000000000000AA";

export async function verifyTurnstileToken(
  token?: string | null,
  clientIp?: string
): Promise<{ success: boolean; error?: string }> {
  const secretKey =
    process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY || DUMMY_SECRET_KEY;

  if (!token) {
    // If running in development without a secret key configured, allow graceful testing
    if (process.env.NODE_ENV === "development" && !process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY) {
      return { success: true };
    }
    return {
      success: false,
      error: "Jeton de sécurité manquant. Merci de réessayer.",
    };
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token);
    if (clientIp) {
      formData.append("remoteip", clientIp);
    }

    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      }
    );

    const data = await res.json();

    if (!data.success) {
      console.warn("Turnstile validation failed:", data["error-codes"]);
      return {
        success: false,
        error: "Validation de sécurité échouée. Merci de recharger la page et de réessayer.",
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Turnstile verification error:", error);
    // On unexpected network error connecting to Cloudflare, fail safely
    return {
      success: false,
      error: "Impossible de vérifier la sécurité. Merci de réessayer plus tard.",
    };
  }
}
