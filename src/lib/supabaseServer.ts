import {
  createServerClient as createSupabaseServerClient,
  type CookieMethodsServer,
} from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createServerClient() {
  const cookieStore = await cookies();
  const rememberPreference = cookieStore.get("glift-remember")?.value;
  const shouldPersistSession = rememberPreference !== "0";

  type NextCookieOptions = Parameters<typeof cookieStore.set>[2];

  const sanitizeCookieOptions = (
    options?: NextCookieOptions,
  ): NextCookieOptions | undefined => {
    if (!options || shouldPersistSession) {
      return options;
    }

    const sanitizedOptions = { ...options };
    delete sanitizedOptions.maxAge;
    delete sanitizedOptions.expires;

    return sanitizedOptions;
  };

  const cookieMethods: CookieMethodsServer = {
    getAll() {
      return cookieStore.getAll().map(({ name, value }) => ({ name, value }));
    },
    setAll(cookiesToSet) {
      cookiesToSet.forEach(({ name, value, options }) => {
        const sanitizedOptions = sanitizeCookieOptions(
          options as NextCookieOptions,
        );

        cookieStore.set(name, value, sanitizedOptions);
      });
    },
  } satisfies CookieMethodsServer;

  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: cookieMethods,
    },
  );
}
