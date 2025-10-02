import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/entrainements", request.url));

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

  await supabase.auth.getUser(); // initialise la session

  return response;
}
