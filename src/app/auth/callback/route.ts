import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/entrainements", request.url));

  const url = new URL(request.url);
  const context = url.searchParams.get("context");
  const type = url.searchParams.get("type");
  const shouldMarkEmailVerified =
    context === "email_verification" || type === "signup";

  type CookieOptions = Parameters<typeof response.cookies.set>[2];

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

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set(name, value, stripTransientCookieOptions(options));
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set(name, "", { ...options, maxAge: -1 });
        },
      },
    }
  );

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(); // initialise la session

  if (userError && userError.status !== 400) {
    console.error("[auth/callback] getUser error", userError);
  }

  if (shouldMarkEmailVerified && user?.id) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email_verified")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError && profileError.code !== "PGRST116") {
      console.error("[auth/callback] profile lookup failed", profileError);
    }

    if (!profileError && profile?.email_verified !== true) {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ email_verified: true })
        .eq("id", user.id);

      if (updateError) {
        console.error("[auth/callback] profile update failed", updateError);
      }
    }
  }

  return response;
}
