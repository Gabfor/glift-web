import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createServerClient() {
  const cookieStore = await cookies();
  const rememberPreference = cookieStore.get("glift-remember")?.value;
  const shouldPersistSession = rememberPreference !== "0";

  const sanitizeCookieOptions = (
    options?: Parameters<typeof cookieStore.set>[2],
  ) => {
    if (!options || shouldPersistSession) {
      return options;
    }

    const sanitizedOptions = { ...options };
    delete sanitizedOptions.maxAge;
    delete sanitizedOptions.expires;

    return sanitizedOptions;
  };

  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(
          name: string,
          value: string,
          options?: Parameters<typeof cookieStore.set>[2]
        ) {
          cookieStore.set(name, value, sanitizeCookieOptions(options));
        },
        remove(
          name: string,
          options?: Parameters<typeof cookieStore.delete>[1]
        ) {
          cookieStore.delete(name, options);
        },
      },
    }
  );
}
