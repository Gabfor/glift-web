import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

let browserClient: SupabaseClient<Database> | null = null;

export function createClient() {
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return browserClient;
}

export function resetSupabaseClient() {
  browserClient = null;
}

export function clearSupabaseStorage() {
  if (typeof window !== "undefined") {
    for (const k of Object.keys(localStorage)) {
      if (
        k &&
        (k.includes("auth-token") || k.startsWith("sb-") || k.startsWith("supabase"))
      ) {
        localStorage.removeItem(k);
      }
    }
  }
}

export async function endLogoutBarrier() {
  clearSupabaseStorage();
  resetSupabaseClient();
  if (typeof window !== "undefined") {
    window.location.href = "/connexion";
  }
}
