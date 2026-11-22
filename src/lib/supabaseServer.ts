import {
  createServerClient as createSupabaseServerClient,
} from "@supabase/ssr";
import { cookies } from "next/headers";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase/types";

/**
 * Creates a Supabase client for Server Components, Server Actions, and Route Handlers.
 * This function uses 'next/headers' which intrinsically makes it server-side only.
 */
export async function createServerClient(): Promise<SupabaseClient<Database>> {
  // Defensive check for environment
  if (typeof window !== "undefined") {
    throw new Error("createServerClient must only be used on the server.");
  }

  const cookieStore = await cookies();

  return createSupabaseServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            const shouldPersistSession =
              cookieStore.get("glift-remember")?.value !== "0";

            cookiesToSet.forEach(({ name, value, options }) => {
              const sanitizedOptions = options ? { ...options } : undefined;
              const isCodeVerifier = name.includes("code-verifier");
              const isRemoval =
                value === "" ||
                (sanitizedOptions?.maxAge !== undefined &&
                  sanitizedOptions.maxAge <= 0) ||
                (sanitizedOptions?.expires instanceof Date &&
                  sanitizedOptions.expires.getTime() <= Date.now());

              if (
                sanitizedOptions &&
                !shouldPersistSession &&
                !isCodeVerifier &&
                !isRemoval
              ) {
                delete sanitizedOptions.maxAge;
                delete sanitizedOptions.expires;
              }

              cookieStore.set(name, value, sanitizedOptions);
            });
          } catch {
            // The setAll method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );
}
