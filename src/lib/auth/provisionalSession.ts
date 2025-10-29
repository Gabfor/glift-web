import { SupabaseClient } from "@supabase/supabase-js";

import { resetEmailConfirmation } from "@/lib/auth/resetEmailConfirmation";

type SessionTokens = {
  access_token: string;
  refresh_token: string;
};

type ProvisionalSessionSuccess = {
  sessionTokens: SessionTokens;
  emailVerified: boolean;
  userId: string | null;
};

type ProvisionalSessionError = {
  error: string;
  status: number;
  code?: "grace_period_expired" | "invalid_credentials" | "server_error";
};

const GRACE_PERIOD_DAYS = 7;
const GRACE_PERIOD_MS = GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000;

const extractSessionTokens = (session: {
  access_token?: string;
  refresh_token?: string;
}): SessionTokens | null => {
  const accessToken = session?.access_token;
  const refreshToken = session?.refresh_token;

  if (!accessToken || !refreshToken) {
    return null;
  }

  return { access_token: accessToken, refresh_token: refreshToken };
};

const isWithinGracePeriod = (createdAt: string | null | undefined) => {
  if (!createdAt) {
    return false;
  }

  const createdTimestamp = Date.parse(createdAt);

  if (Number.isNaN(createdTimestamp)) {
    return false;
  }

  const now = Date.now();

  return now - createdTimestamp <= GRACE_PERIOD_MS;
};

export async function createProvisionalSession(
  adminClient: SupabaseClient,
  {
    email,
    password,
  }: {
    email: string;
    password: string;
  },
): Promise<ProvisionalSessionSuccess | ProvisionalSessionError> {
  try {
    const { data, error } = await adminClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data?.session) {
      const normalizedMessage = error?.message?.toLowerCase() ?? "";
      const invalidCredentials = normalizedMessage.includes("invalid");
      const emailNotConfirmed =
        error?.code === "email_not_confirmed" ||
        normalizedMessage.includes("email not confirmed");

      if (!invalidCredentials && emailNotConfirmed) {
        const linkResponse = await adminClient.auth.admin.generateLink({
          type: "magiclink",
          email,
        });

        const provisionalUser = linkResponse.data.user;
        const emailOtp = linkResponse.data.properties?.email_otp;

        if (!provisionalUser || !emailOtp) {
          console.warn(
            "Magic link generation failed for provisional session",
            linkResponse.error ?? "Missing OTP",
          );

          return {
            error:
              "Connexion impossible après la création du compte. Merci de vérifier vos identifiants.",
            status: 401,
          } satisfies ProvisionalSessionError;
        }

        if (!isWithinGracePeriod(provisionalUser.created_at)) {
          return {
            error:
              "Votre période d'accès temporaire est expirée. Veuillez confirmer votre email pour continuer.",
            status: 403,
            code: "grace_period_expired",
          } satisfies ProvisionalSessionError;
        }

        const { data: otpData, error: otpError } = await adminClient.auth.verifyOtp({
          email,
          token: emailOtp,
          type: "magiclink",
        });

        if (otpError || !otpData?.session) {
          console.warn(
            "OTP verification failed for provisional session",
            otpError ?? "Missing session",
          );

          return {
            error:
              "Connexion impossible après la création du compte. Merci de vérifier vos identifiants.",
            status: 401,
          } satisfies ProvisionalSessionError;
        }

        const sessionTokensFromOtp = extractSessionTokens(otpData.session);

        if (!sessionTokensFromOtp) {
          return {
            error: "Impossible de générer une session temporaire.",
            status: 500,
            code: "server_error",
          } satisfies ProvisionalSessionError;
        }

        let emailVerified = Boolean(
          otpData.session.user?.email_confirmed_at ?? provisionalUser.email_confirmed_at,
        );

        const userId =
          otpData.session.user?.id ?? provisionalUser?.id ?? null;

        if (emailVerified && userId) {
          const resetSuccess = await resetEmailConfirmation(adminClient, userId);

          if (!resetSuccess) {
            console.warn(
              "Unable to clear Supabase email confirmation during provisional session",
              { userId },
            );
          } else {
            emailVerified = false;
          }
        }

        return {
          sessionTokens: sessionTokensFromOtp,
          emailVerified,
          userId,
        } satisfies ProvisionalSessionSuccess;
      }

      return {
        error:
          invalidCredentials
            ? "Identifiants invalides."
            : "Connexion impossible après la création du compte. Merci de vérifier vos identifiants.",
        status: invalidCredentials ? 400 : 401,
        code: invalidCredentials ? "invalid_credentials" : undefined,
      } satisfies ProvisionalSessionError;
    }

    const { session } = data;
    const sessionTokens = extractSessionTokens(session);

    if (!sessionTokens) {
      return {
        error: "Impossible de générer une session temporaire.",
        status: 500,
        code: "server_error",
      } satisfies ProvisionalSessionError;
    }

    const user = session.user;
    const userId = user?.id ?? null;
    const isEmailConfirmed = Boolean(user?.email_confirmed_at);

    if (isEmailConfirmed) {
      return {
        sessionTokens,
        emailVerified: true,
        userId,
      } satisfies ProvisionalSessionSuccess;
    }

    if (!isWithinGracePeriod(user?.created_at)) {
      return {
        error:
          "Votre période d'accès temporaire est expirée. Veuillez confirmer votre email pour continuer.",
        status: 403,
        code: "grace_period_expired",
      } satisfies ProvisionalSessionError;
    }

    return {
      sessionTokens,
      emailVerified: false,
      userId,
    } satisfies ProvisionalSessionSuccess;
  } catch (unhandledError) {
    console.error("createProvisionalSession() unexpected error", unhandledError);

    return {
      error:
        "Une erreur est survenue lors de la création de la session temporaire.",
      status: 500,
      code: "server_error",
    } satisfies ProvisionalSessionError;
  }
}
