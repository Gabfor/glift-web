import type { CookieOptionsWithName } from "@supabase/auth-helpers-shared";

export type SupabaseSessionScope = "front" | "admin";

const SUPABASE_COOKIE_NAMES: Record<SupabaseSessionScope, string> = {
  front: "sb-glift-front-auth-token",
  admin: "sb-glift-admin-auth-token",
};

export const getSupabaseCookieOptions = (
  scope: SupabaseSessionScope,
): CookieOptionsWithName => ({
  name: SUPABASE_COOKIE_NAMES[scope],
});

export const getSupabaseCookieName = (scope: SupabaseSessionScope): string =>
  SUPABASE_COOKIE_NAMES[scope];
