import type { SupabaseClient } from "@supabase/supabase-js";

let inFlight: Promise<any> | null = null;

export async function ensureClientSession(supabase: SupabaseClient) {
  // Si déjà une session en mémoire, on ne fait rien
  const { data: { session } } = await supabase.auth.getSession();
  if (session) return session;

  // Mutualise les appels concurrents
  if (!inFlight) {
    inFlight = (async () => {
      const res = await fetch("/api/auth/session", { credentials: "include" });
      if (!res.ok) { inFlight = null; return null; }
      const tokens = await res.json().catch(() => null);
      if (!tokens) { inFlight = null; return null; }

      const { data } = await supabase.auth.setSession({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
      });
      inFlight = null;
      return data.session ?? null;
    })();
  }
  return inFlight;
}
