import { NextRequest, NextResponse } from "next/server";

import { createAdminClient, createClient } from "@/lib/supabase/server";
import { sendVerificationEmail } from "@/lib/email/sendVerificationEmail";

const SITE_URL_ENV_KEYS = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_APP_URL",
  "SITE_URL",
  "APP_URL",
];

function resolveSiteUrl(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      return new URL(origin).origin;
    } catch (error) {
      console.warn("[send-verification-email] invalid origin header", error);
    }
  }

  for (const key of SITE_URL_ENV_KEYS) {
    const value = process.env[key];
    if (!value) continue;

    try {
      return new URL(value).origin;
    } catch (error) {
      console.warn(
        `[send-verification-email] invalid ${key} environment value`,
        error,
      );
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: sessionError,
    } = await supabase.auth.getUser();

    if (sessionError) {
      console.error("[send-verification-email] getUser failed", sessionError);
      if (sessionError.status === 400) {
        return NextResponse.json({ error: "not-authenticated" }, { status: 401 });
      }

      return NextResponse.json({ error: "session-error" }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({ error: "not-authenticated" }, { status: 401 });
    }

    if (!user.email) {
      return NextResponse.json({ error: "missing-email" }, { status: 400 });
    }

    if (user.email_confirmed_at) {
      return NextResponse.json({ success: true, alreadyVerified: true });
    }

    const siteUrl = resolveSiteUrl(request);

    const redirectTo = siteUrl
      ? `${siteUrl}/auth/callback?context=email_verification`
      : undefined;

    const resendApiKey = process.env.RESEND_API_KEY;
    const resendFrom = process.env.RESEND_FROM;

    if (resendApiKey && resendFrom) {
      try {
        const adminClient = createAdminClient();
        const { data: linkData, error: linkError } =
          await adminClient.auth.admin.generateLink({
            type: "magiclink",
            email: user.email,
            options: redirectTo ? { redirectTo } : undefined,
          });

        if (linkError) {
          console.error(
            "[send-verification-email] generateLink failed",
            linkError,
          );
        } else {
          const actionLink = linkData?.properties?.action_link;

          if (actionLink) {
            await sendVerificationEmail({
              to: user.email,
              verificationLink: actionLink,
              name:
                typeof user.user_metadata?.name === "string"
                  ? user.user_metadata.name
                  : undefined,
            });

            return NextResponse.json({ success: true, via: "resend" });
          }

          console.warn(
            "[send-verification-email] missing action link in generateLink response",
            linkData,
          );
        }
      } catch (error) {
        console.error(
          "[send-verification-email] unexpected Resend flow error",
          error,
        );
      }
    }

    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: user.email,
      options: redirectTo
        ? { emailRedirectTo: redirectTo }
        : undefined,
    });

    if (resendError) {
      console.error("[send-verification-email] resend failed", resendError);
      return NextResponse.json({ error: "resend-failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true, via: "supabase" });
  } catch (error) {
    console.error("[send-verification-email] unexpected error", error);
    return NextResponse.json({ error: "unexpected-error" }, { status: 500 });
  }
}
