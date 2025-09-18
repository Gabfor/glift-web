"use client";

import { createClient } from "@/lib/supabaseClient";

export function createClientComponentClient() {
  return createClient();
}

export { beginLogoutBarrier, endLogoutBarrier, resetSupabaseClient, clearSupabaseStorage } from "@/lib/supabaseClient";
