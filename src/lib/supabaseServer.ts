import {
  createServerClient as createSupabaseServerClient,
  type CookieMethodsServer,
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
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
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
