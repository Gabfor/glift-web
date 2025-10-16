import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/server";
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
  const fallbackConfirmedUserId = url.searchParams.get("user");
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const token = url.searchParams.get("token");
  type ExchangeError =
    | Awaited<ReturnType<typeof supabase.auth.exchangeCodeForSession>>["error"]
    | Awaited<ReturnType<typeof supabase.auth.verifyOtp>>["error"]
    | null;

  let exchangeError: ExchangeError = null;

  let confirmedUserId: string | null = null;

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    exchangeError = error;

    if (data?.user?.id) {
      confirmedUserId = data.user.id;
    }
  } else {
    type VerifyOtpParams = Parameters<(typeof supabase.auth)["verifyOtp"]>[0];
    const allowedVerifyTypes = [
      "signup",
      "magiclink",
      "recovery",
      "invite",
      "email_change",
      "email",
    ] as const;
    type AllowedVerifyType = (typeof allowedVerifyTypes)[number];

    const rawTypeParam = url.searchParams
      .get("type")
      ?.toLowerCase() as VerifyOtpParams["type"] | undefined;

    const isAllowedVerifyType = (
      value: VerifyOtpParams["type"],
    ): value is AllowedVerifyType =>
      allowedVerifyTypes.includes(value as AllowedVerifyType);

    const typeParam =
      rawTypeParam && isAllowedVerifyType(rawTypeParam) ? rawTypeParam : undefined;

    if (typeParam && (tokenHash || token)) {
      const emailParam =
        url.searchParams.get("email") ?? url.searchParams.get("new_email");

      if (tokenHash) {
        const verifyParams: Extract<VerifyOtpParams, { token_hash: string }> = {
          type: typeParam,
          token_hash: tokenHash,
        };

        const { data, error } = await supabase.auth.verifyOtp(verifyParams);
        exchangeError = error;

        if (data?.user?.id) {
          confirmedUserId = data.user.id;
        }
      } else if (token && emailParam) {
        const verifyParams: Extract<VerifyOtpParams, { token: string; email: string }> = {
          type: typeParam,
          token,
          email: emailParam,
        };

        const { data, error } = await supabase.auth.verifyOtp(verifyParams);
        exchangeError = error;

        if (data?.user?.id) {
          confirmedUserId = data.user.id;
        }
      } else if (token && !emailParam) {
        console.warn(
          "[auth-callback] Missing email parameter for email OTP verification",
        );
      }
    }
  }

  const {
    data: userData,
    error: sessionError,
  } = await supabase.auth.getUser();
  const user = userData?.user ?? null;

  if (!confirmedUserId && user) {
    confirmedUserId = user.id;
  }

  if (!confirmedUserId && fallbackConfirmedUserId) {
    confirmedUserId = fallbackConfirmedUserId;
  }

  const redirectUrl = new URL("/entrainements", request.url).toString();
  const queryErrorDescription =
    url.searchParams.get("error_description") ?? undefined;
  const rawErrorCode = url.searchParams.get("error_code");
  const normalizedErrorCode = rawErrorCode?.toLowerCase() ?? null;
  const otpExpired = normalizedErrorCode === "otp_expired";

  const rawSessionErrorMessage = sessionError?.message?.trim();
  const normalizedSessionErrorMessage = rawSessionErrorMessage
    ? rawSessionErrorMessage.toLowerCase()
    : null;
  const shouldIgnoreSessionError =
    Boolean(confirmedUserId) &&
    normalizedSessionErrorMessage !== null &&
    ["not authenticated", "auth session missing"].includes(
      normalizedSessionErrorMessage,
    );

  const sessionErrorMessageForDisplay = shouldIgnoreSessionError
    ? undefined
    : rawSessionErrorMessage;

  let errorMessage =
    queryErrorDescription ??
    exchangeError?.message ??
    (otpExpired
      ? "Le lien de confirmation a expiré. Merci de demander un nouveau lien depuis l'application."
      : sessionErrorMessageForDisplay);

  let authEmailConfirmed = false;

  if (errorMessage && confirmedUserId && otpExpired) {
    try {
      const adminClient = createAdminClient();
      const { data: adminUserData, error: adminLookupError } =
        await adminClient.auth.admin.getUserById(confirmedUserId);

      if (adminLookupError) {
        console.warn(
          "[auth-callback] Unable to retrieve user after OTP expiration",
          adminLookupError,
        );
      } else {
        const emailConfirmedAt = adminUserData?.user?.email_confirmed_at;

        if (emailConfirmedAt) {
          authEmailConfirmed = true;
          errorMessage = undefined;
        }
      }
    } catch (adminLookupException) {
      console.error(
        "[auth-callback] Unable to create admin client to check OTP expiration",
        adminLookupException,
      );
    }
  }

  if (!errorMessage && confirmedUserId) {
    let emailVerifiedUpdated = false;

    if (user && user.id === confirmedUserId) {
      const { error: profileUpdateError } = await supabase
        .from("profiles")
        .update({ email_verified: true })
        .eq("id", confirmedUserId);

      if (profileUpdateError) {
        console.warn(
          "[auth-callback] Unable to mark email as verified with session",
          profileUpdateError,
        );
      } else {
        emailVerifiedUpdated = true;
      }
    }

    if (!emailVerifiedUpdated) {
      try {
        const adminClient = createAdminClient();

        if (!authEmailConfirmed) {
          const { data: adminUserData, error: adminLookupError } =
            await adminClient.auth.admin.getUserById(confirmedUserId);

          if (adminLookupError) {
            console.warn(
              "[auth-callback] Unable to verify auth email confirmation state with admin client",
              adminLookupError,
            );
          } else {
            authEmailConfirmed = Boolean(
              adminUserData?.user?.email_confirmed_at,
            );
          }
        }

        if (authEmailConfirmed) {
          const { error: adminUpdateError } = await adminClient
            .from("profiles")
            .update({ email_verified: true })
            .eq("id", confirmedUserId);

          if (adminUpdateError) {
            console.error(
              "[auth-callback] Unable to mark email as verified with admin client",
              adminUpdateError,
            );
          } else {
            emailVerifiedUpdated = true;
          }
        } else {
          console.warn(
            "[auth-callback] Auth email is not marked as confirmed despite OTP recovery",
            { confirmedUserId },
          );
        }
      } catch (adminClientError) {
        console.error(
          "[auth-callback] Unable to create admin Supabase client",
          adminClientError,
        );
      }
    }

    if (!emailVerifiedUpdated) {
      console.warn(
        "[auth-callback] Email verification confirmation succeeded but profile update failed",
        { confirmedUserId },
      );
    }
  } else if (!errorMessage && !confirmedUserId) {
    console.warn(
      "[auth-callback] Email confirmation succeeded but user identifier is unavailable",
    );
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
