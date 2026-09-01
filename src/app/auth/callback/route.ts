import { createServerClient } from "@supabase/ssr";
import type { AuthError, SupabaseClient, User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/server";
import { UserService } from "@/lib/services/userService";
import { SubscriptionService } from "@/lib/services/subscriptionService";
import { PaymentService } from "@/lib/services/paymentService";
import type { Database } from "@/lib/supabase/types";
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

const DEFAULT_ADMIN_USERS_PER_PAGE = 100;

const findAdminUserByEmail = async (
  adminClient: SupabaseClient<Database>,
  email: string,
): Promise<{ user: User | null; error: AuthError | null }> => {
  const normalizedEmail = email.toLowerCase();
  let page = 1;

  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage: DEFAULT_ADMIN_USERS_PER_PAGE,
    });

    if (error) {
      return { user: null, error };
    }

    const users = data?.users ?? [];
    const matchedUser = users.find((candidate) => {
      const candidateEmail = candidate.email?.toLowerCase();
      const candidateNewEmail = candidate.new_email?.toLowerCase();

      return (
        candidateEmail === normalizedEmail ||
        candidateNewEmail === normalizedEmail
      );
    });

    if (matchedUser) {
      return { user: matchedUser, error: null };
    }

    const nextPage = data?.nextPage ?? null;
    const lastPage = data?.lastPage ?? null;

    if (
      nextPage === null ||
      nextPage === page ||
      (typeof lastPage === "number" && lastPage !== 0 && page >= lastPage) ||
      users.length === 0
    ) {
      break;
    }

    page = nextPage;
  }

  return { user: null, error: null };
};

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

  const supabase = createServerClient<Database>(
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
  let confirmedUserEmailConfirmedAt: string | null = null;

  const queryEmailParam =
    url.searchParams.get("email") ?? url.searchParams.get("new_email");

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

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    exchangeError = error;

    const exchangeUserId =
      data?.user?.id ?? data?.session?.user?.id ?? null;

    if (exchangeUserId) {
      confirmedUserId = exchangeUserId;
    }

    const exchangeEmailConfirmedAt =
      data?.user?.email_confirmed_at ??
      data?.session?.user?.email_confirmed_at ??
      null;

    if (exchangeEmailConfirmedAt) {
      confirmedUserEmailConfirmedAt = exchangeEmailConfirmedAt;
    }
  } else {
    if (typeParam && (tokenHash || token)) {
      if (tokenHash) {
        const verifyParams: Extract<VerifyOtpParams, { token_hash: string }> = {
          type: typeParam,
          token_hash: tokenHash,
        };

        const { data, error } = await supabase.auth.verifyOtp(verifyParams);
        exchangeError = error;

        const verifiedUserId =
          data?.user?.id ?? data?.session?.user?.id ?? null;

        if (verifiedUserId) {
          confirmedUserId = verifiedUserId;
        }

        const verifiedEmailConfirmedAt =
          data?.user?.email_confirmed_at ??
          data?.session?.user?.email_confirmed_at ??
          null;

        if (verifiedEmailConfirmedAt) {
          confirmedUserEmailConfirmedAt = verifiedEmailConfirmedAt;
        }
      } else if (token && queryEmailParam) {
        const verifyParams: Extract<VerifyOtpParams, { token: string; email: string }> = {
          type: typeParam,
          token,
          email: queryEmailParam,
        };

        const { data, error } = await supabase.auth.verifyOtp(verifyParams);
        exchangeError = error;

        if (data?.user?.id) {
          confirmedUserId = data.user.id;
        }
      } else if (token && !queryEmailParam) {
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

  if (!confirmedUserEmailConfirmedAt && user?.email_confirmed_at) {
    confirmedUserEmailConfirmedAt = user.email_confirmed_at;
  }

  if (!confirmedUserId && fallbackConfirmedUserId) {
    confirmedUserId = fallbackConfirmedUserId;
  }

  if (!confirmedUserId && queryEmailParam) {
    try {
      const adminClient = createAdminClient();
      const { user: matchedUser, error: adminLookupError } =
        await findAdminUserByEmail(adminClient, queryEmailParam);

      if (adminLookupError) {
        console.warn(
          "[auth-callback] Unable to retrieve user by email after verification",
          adminLookupError,
        );
      } else if (matchedUser?.id) {
        confirmedUserId = matchedUser.id;

        if (
          !confirmedUserEmailConfirmedAt &&
          matchedUser.email_confirmed_at
        ) {
          confirmedUserEmailConfirmedAt = matchedUser.email_confirmed_at;
        }
      }
    } catch (adminLookupException) {
      console.error(
        "[auth-callback] Unable to create admin client to retrieve user by email",
        adminLookupException,
      );
    }
  }

  const getRequestBaseUrl = (req: NextRequest): URL => {
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    const proto =
      req.headers.get("x-forwarded-proto") ||
      req.nextUrl.protocol.replace(":", "") ||
      "http";

    if (host) {
      const sanitizedHost = host.replace(/^0\.0\.0\.0/, "localhost");
      return new URL(`${proto}://${sanitizedHost}`);
    }

    const rawUrl = new URL(req.url);
    if (rawUrl.hostname === "0.0.0.0") {
      rawUrl.hostname = "localhost";
    }
    return rawUrl;
  };

  const baseUrl = getRequestBaseUrl(request);

  const planParam = url.searchParams.get("plan");
  const nextParam = url.searchParams.get("next");
  const isRecovery = typeParam === "recovery";
  const isOAuth = Boolean(code) && !typeParam;

  let defaultTarget = "/tableau-de-bord";
  if (isRecovery) {
    defaultTarget = "/reinitialiser-mot-de-passe";
  } else if (planParam === "premium") {
    defaultTarget = "/post-inscription?plan=premium";
  }

  const targetPath =
    nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
      ? nextParam
      : defaultTarget;
  const redirectUrl = new URL(targetPath, baseUrl).toString();
  const queryErrorDescription =
    url.searchParams.get("error_description") ?? undefined;
  const rawErrorCode = url.searchParams.get("error_code");
  const normalizedErrorCode = rawErrorCode?.toLowerCase() ?? null;
  const otpExpired = normalizedErrorCode === "otp_expired";

  const rawSessionErrorMessage = sessionError?.message?.trim();
  const normalizedSessionErrorMessage = rawSessionErrorMessage
    ? rawSessionErrorMessage.toLowerCase()
    : null;
  const isSessionAuthMissing =
    normalizedSessionErrorMessage !== null &&
    ["not authenticated", "auth session missing"].includes(
      normalizedSessionErrorMessage,
    );
  const shouldIgnoreSessionError =
    Boolean(confirmedUserId) && isSessionAuthMissing;

  const shouldRedirectToLogin =
    !confirmedUserId &&
    isSessionAuthMissing &&
    Boolean(code || tokenHash || token || fallbackConfirmedUserId);

  if (shouldRedirectToLogin) {
    const loginUrl = new URL("/connexion", baseUrl);
    const callbackPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    loginUrl.searchParams.set("next", encodeURIComponent(callbackPath));

    const redirectResponse = NextResponse.redirect(loginUrl);

    cookiesToSet.forEach(({ name, value, options }) => {
      redirectResponse.cookies.set(name, value, options);
    });

    cookiesToRemove.forEach(({ name, options }) => {
      redirectResponse.cookies.set(name, "", { ...options, maxAge: -1 });
    });

    return redirectResponse;
  }

  const sessionErrorMessageForDisplay = shouldIgnoreSessionError
    ? undefined
    : rawSessionErrorMessage;

  let errorMessage =
    queryErrorDescription ??
    exchangeError?.message ??
    (otpExpired
      ? "Le lien de confirmation a expiré. Merci de demander un nouveau lien depuis l'application."
      : sessionErrorMessageForDisplay);

  let authEmailConfirmed = Boolean(confirmedUserEmailConfirmedAt);

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
          confirmedUserEmailConfirmedAt = emailConfirmedAt;
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

  let isNewOAuthSignup = false;
  let chosenPlanForRedirect: "starter" | "premium" = "starter";

  if (!errorMessage && confirmedUserId) {
    try {
      const adminClient = createAdminClient();
      const userService = new UserService(adminClient);
      const subscriptionService = new SubscriptionService(adminClient);
      const paymentService = new PaymentService(adminClient);

      // Vérifier si le profil existe
      const { data: existingProfile } = await adminClient
        .from("profiles")
        .select("id, name, subscription_plan")
        .eq("id", confirmedUserId)
        .maybeSingle();

      const chosenPlan: "starter" | "premium" =
        planParam === "premium" ? "premium" : "starter";
      chosenPlanForRedirect = chosenPlan;
      isNewOAuthSignup = isOAuth && !existingProfile;

      const extractFirstName = (rawName?: string | null): string | null => {
        if (!rawName) return null;
        const trimmed = rawName.trim();
        if (!trimmed) return null;
        return trimmed.split(/\s+/)[0] || null;
      };

      let resolvedEmail = queryEmailParam || user?.email;
      let resolvedName =
        user?.user_metadata?.given_name ||
        user?.user_metadata?.first_name ||
        extractFirstName(user?.user_metadata?.full_name) ||
        extractFirstName(user?.user_metadata?.name);

      if (!resolvedEmail || !resolvedName) {
        const { data: adminUserData } =
          await adminClient.auth.admin.getUserById(confirmedUserId);
        resolvedEmail = resolvedEmail || adminUserData?.user?.email;
        resolvedName =
          resolvedName ||
          adminUserData?.user?.user_metadata?.given_name ||
          adminUserData?.user?.user_metadata?.first_name ||
          extractFirstName(adminUserData?.user?.user_metadata?.full_name) ||
          extractFirstName(adminUserData?.user?.user_metadata?.name) ||
          (resolvedEmail ? resolvedEmail.split("@")[0] : "Utilisateur");
      }

      if (!existingProfile) {
        // Initialisation complète pour nouvel utilisateur (OAuth ou nouvel inscrit)
        await userService.createOrUpdateProfile(confirmedUserId, {
          name: resolvedName || "Utilisateur",
          plan: chosenPlan,
        });

        await Promise.allSettled([
          adminClient
            .from("profiles")
            .update({ email_verified: true })
            .eq("id", confirmedUserId),
          userService.initializePreferences(confirmedUserId),
          subscriptionService.initializeSubscription(
            confirmedUserId,
            chosenPlan,
          ),
          resolvedEmail
            ? paymentService.createCustomerAndStarterSubscription(
                confirmedUserId,
                resolvedEmail,
                resolvedName || "Utilisateur",
                chosenPlan,
              )
            : Promise.resolve(),
        ]);
      } else {
        // Utilisateur existant : s'assurer que l'email est marqué comme vérifié et que le prénom seul est utilisé
        const updatePayload: { email_verified: boolean; name?: string } = {
          email_verified: true,
        };
        if (resolvedName && resolvedName !== "Utilisateur") {
          updatePayload.name = resolvedName;
        }

        await adminClient
          .from("profiles")
          .update(updatePayload)
          .eq("id", confirmedUserId);
      }
    } catch (profileInitError) {
      console.error(
        "[auth-callback] Error initializing profile or verifying email:",
        profileInitError,
      );
    }
  } else if (!errorMessage && !confirmedUserId) {
    console.warn(
      "[auth-callback] Email confirmation succeeded but user identifier is unavailable",
    );
  }

  // Si pas d'erreur et flux OAuth, récupération ou navigation directe :
  if (!errorMessage && (isOAuth || isRecovery || !typeParam)) {
    const destinationUrl =
      isNewOAuthSignup && !nextParam
        ? new URL(
            `/inscription/informations?plan=${chosenPlanForRedirect}&oauth=true`,
            baseUrl,
          ).toString()
        : redirectUrl;

    const redirectResponse = NextResponse.redirect(new URL(destinationUrl));
    cookiesToSet.forEach(({ name, value, options }) => {
      redirectResponse.cookies.set(name, value, options);
    });
    cookiesToRemove.forEach(({ name, options }) => {
      redirectResponse.cookies.set(name, "", { ...options, maxAge: -1 });
    });
    return redirectResponse;
  }

  // En cas d'erreur lors d'une connexion OAuth, rediriger vers la page de connexion avec message
  if (errorMessage && isOAuth) {
    const loginUrl = new URL("/connexion", baseUrl);
    loginUrl.searchParams.set("error", errorMessage);
    const redirectResponse = NextResponse.redirect(loginUrl);
    cookiesToSet.forEach(({ name, value, options }) => {
      redirectResponse.cookies.set(name, value, options);
    });
    cookiesToRemove.forEach(({ name, options }) => {
      redirectResponse.cookies.set(name, "", { ...options, maxAge: -1 });
    });
    return redirectResponse;
  }

  const html = renderAutoCloseTemplate({
    success: !errorMessage,
    redirectUrl,
    successMessage:
      "Ton adresse email a été confirmée. Tu peux retourner sur l'application Glift.",
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
