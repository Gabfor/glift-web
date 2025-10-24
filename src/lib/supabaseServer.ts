import "server-only";

import {
  createServerClient as createSupabaseServerClient,
  type CookieMethodsServer,
} from "@supabase/ssr";
import { cookies } from "next/headers";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./supabase/types";

export async function createServerClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = cookies();
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

  const isReadOnlyCookiesError = (error: unknown): boolean =>
    error instanceof Error &&
    error.message.includes(
      "Cookies can only be modified in a Server Action or Route Handler",
    );

  const cookieMethods: CookieMethodsServer = {
    getAll() {
      return cookieStore.getAll().map(({ name, value }) => ({ name, value }));
    },
    setAll(cookiesToSet) {
      cookiesToSet.forEach(({ name, value, options }) => {
        const sanitizedOptions = sanitizeCookieOptions(
          options as NextCookieOptions,
        );

        try {
          cookieStore.set(name, value, sanitizedOptions);
        } catch (error) {
          if (!isReadOnlyCookiesError(error)) {
            throw error;
          }
        }
      });
    },
  } satisfies CookieMethodsServer;

  return createSupabaseServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: cookieMethods,
    },
  );
}
