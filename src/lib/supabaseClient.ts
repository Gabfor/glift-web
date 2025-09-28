import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

let browserClient: SupabaseClient<Database> | null = null;

export function createClient(): SupabaseClient<Database> {
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookieOptions: { path: "/" },
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          multiTab: true,
        },
      }
    );
  }

  return browserClient;
}

export function resetSupabaseClient(): void {
  browserClient = null;
}

function purgeStorage(store: Storage) {
  const keys = new Set(Object.keys(store));
  for (const key of keys) {
    if (
      key.includes("auth-token") ||
      key.startsWith("sb-") ||
      key.startsWith("supabase")
    ) {
      store.removeItem(key);
    }
  }
}

export function clearSupabaseStorage(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    purgeStorage(window.localStorage);
  } catch {}

  try {
    purgeStorage(window.sessionStorage);
  } catch {}
}

export function endLogoutBarrier(): void {
  if (typeof window === "undefined") {
    return;
  }

  clearSupabaseStorage();
  resetSupabaseClient();
  window.location.replace("/connexion");
}
