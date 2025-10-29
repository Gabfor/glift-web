import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabaseServer";

import type { Database } from "./types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { SupabaseSessionScope } from "./sessionScope";

export async function createClient({
  scope = "front",
}: { scope?: SupabaseSessionScope } = {}): Promise<
  SupabaseClient<Database>
> {
  return createServerClient({ scope });
}

export function createAdminClient(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SERVICE_ROLE ??
    process.env.SUPABASE_SERVICE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Supabase service credentials are not configured.");
  }

  return createSupabaseClient<Database>(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
