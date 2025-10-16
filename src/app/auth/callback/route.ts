import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

type CookieOptions = Parameters<NextResponse["cookies"]["set"]>[2];

type PendingCookie = {
  name: string;
  value: string;
  options?: CookieOptions;
};

type PendingCookieRemoval = {
  name: string;
  options?: CookieOptions;
};

type CallbackTemplateOptions = {
  success: boolean;
  redirectUrl: string;
  successMessage: string;
  errorMessage?: string;
};

const CALLBACK_EVENT_SOURCE = "glift-auth-callback";

const renderAutoCloseTemplate = ({
  success,
  redirectUrl,
  successMessage,
  errorMessage,
}: CallbackTemplateOptions) => {
  const payload = {
    source: CALLBACK_EVENT_SOURCE,
    event: success ? "email-confirmed" : "email-confirmation-error",
    ...(success
      ? {}
      : { message: errorMessage ?? "Le lien de confirmation est invalide." }),
  } satisfies Record<string, unknown>;

  const bodyMessage = success
    ? successMessage
    : errorMessage ??
      "Le lien de confirmation est invalide ou a expiré. Veuillez demander un nouveau lien depuis l'application.";

  return `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="robots" content="noindex" />
    <title>Glift — Confirmation</title>
    <style>
      :root {
        color-scheme: light dark;
      }

      body {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        margin: 0;
        padding: 0;
        display: grid;
        min-height: 100vh;
        place-items: center;
        background: #0f172a;
        color: #f8fafc;
      }

      .message {
        max-width: 420px;
        text-align: center;
        line-height: 1.5;
        opacity: 0;
        transition: opacity 120ms ease-in-out;
      }

      body.show-message .message {
        opacity: 1;
      }

      a {
        color: inherit;
      }
    </style>
    <script>
      const payload = ${JSON.stringify(payload)};
      const redirectUrl = ${JSON.stringify(redirectUrl)};
      const hasOpener = typeof window !== "undefined" && window.opener && !window.opener.closed;

      if (hasOpener) {
        try {
          const origin = new URL(redirectUrl).origin;
          window.opener.postMessage(payload, origin);
        } catch (postMessageError) {
          console.warn("[auth-callback] Unable to postMessage", postMessageError);
        }
      }

      try {
        window.close();
      } catch (closeError) {
        console.warn("[auth-callback] Unable to close window", closeError);
      }

      window.addEventListener("DOMContentLoaded", () => {
        requestAnimationFrame(() => {
          document.body.classList.add("show-message");
        });
      });
    </script>
  </head>
  <body>
    <div class="message">
      <p>${bodyMessage}</p>
      <p>
        <a href="${redirectUrl}" rel="noreferrer">Retourner sur Glift</a>
      </p>
    </div>
  </body>
</html>`;
};

export async function GET(request: NextRequest) {
  const rememberPreference = request.cookies.get("glift-remember")?.value;
  const shouldPersistSession = rememberPreference !== "0";

  const stripTransientCookieOptions = (
    options?: CookieOptions,
  ): CookieOptions | undefined => {
    if (!options || shouldPersistSession) {
      return options;
    }

    const sanitizedOptions = { ...options };
    delete sanitizedOptions.maxAge;
    delete sanitizedOptions.expires;

    return sanitizedOptions;
  };

  const cookiesToSet: PendingCookie[] = [];
  const cookiesToRemove: PendingCookieRemoval[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookiesToSet.push({
            name,
            value,
            options: stripTransientCookieOptions(options),
          });
        },
        remove(name: string, options: CookieOptions) {
          cookiesToRemove.push({
            name,
            options: stripTransientCookieOptions(options),
          });
        },
      },
    }
  );

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const token = url.searchParams.get("token");
  type ExchangeError =
    | Awaited<ReturnType<typeof supabase.auth.exchangeCodeForSession>>["error"]
    | Awaited<ReturnType<typeof supabase.auth.verifyOtp>>["error"]
    | null;

  let exchangeError: ExchangeError = null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    exchangeError = error;
  } else {
    type VerifyOtpParams = Parameters<(typeof supabase.auth)["verifyOtp"]>[0];

    const typeParam = url.searchParams
      .get("type")
      ?.toLowerCase() as VerifyOtpParams["type"] | undefined;
    const allowedVerifyTypes = new Set<VerifyOtpParams["type"]>([
      "signup",
      "magiclink",
      "recovery",
      "invite",
      "email_change",
    ]);

    const hasValidToken = Boolean(tokenHash ?? token);

    if (hasValidToken && typeParam && allowedVerifyTypes.has(typeParam)) {
      const verifyParams: VerifyOtpParams = {
        type: typeParam,
        ...(tokenHash
          ? { token_hash: tokenHash }
          : token
            ? { token }
            : {}),
      };

      const emailParam =
        url.searchParams.get("email") ?? url.searchParams.get("new_email");

      if (emailParam) {
        verifyParams.email = emailParam;
      }

      const { error } = await supabase.auth.verifyOtp(verifyParams);
      exchangeError = error;
    }
  }

  const {
    data: userData,
    error: sessionError,
  } = await supabase.auth.getUser();
  const user = userData?.user ?? null;

  const redirectUrl = new URL("/entrainements", request.url).toString();
  const queryErrorDescription = url.searchParams.get("error_description") ?? undefined;
  const otpExpired = url.searchParams.get("error_code") === "otp_expired";

  const errorMessage =
    queryErrorDescription ??
    exchangeError?.message ??
    (otpExpired
      ? "Le lien de confirmation a expiré. Merci de demander un nouveau lien depuis l'application."
      : sessionError?.message);

  if (!errorMessage && user) {
    const { error: profileUpdateError } = await supabase
      .from("profiles")
      .update({ email_verified: true })
      .eq("id", user.id);

    if (profileUpdateError) {
      console.error(
        "[auth-callback] Unable to mark email as verified",
        profileUpdateError,
      );
    }
  }

  const html = renderAutoCloseTemplate({
    success: !errorMessage,
    redirectUrl,
    successMessage:
      "Votre adresse email a été confirmée. Vous pouvez retourner sur l'application Glift.",
    errorMessage,
  });

  const response = new NextResponse(html, {
    status: errorMessage ? 400 : 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
    },
  });

  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  cookiesToRemove.forEach(({ name, options }) => {
    response.cookies.set(name, "", { ...options, maxAge: -1 });
  });

  return response;
}
