import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

const globalForSupabase = globalThis as unknown as {
  __supabaseServiceRoleClient?: SupabaseClient<Database>;
};

export function getServiceRoleClient() {
  if (!globalForSupabase.__supabaseServiceRoleClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRoleKey) {
      throw new Error("Supabase service role environment variables are not configured.");
    }

    globalForSupabase.__supabaseServiceRoleClient = createClient<Database>(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return globalForSupabase.__supabaseServiceRoleClient;
}
