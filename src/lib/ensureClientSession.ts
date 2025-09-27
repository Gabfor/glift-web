import type { SupabaseClient } from "@supabase/supabase-js";

let inFlight: Promise<any> | null = null;

export async function ensureClientSession(supabase: SupabaseClient) {
  // Si déjà une session en mémoire, on ne fait rien
  const { data: { session } } = await supabase.auth.getSession();
  if (session) return session;

  // Mutualise les appels concurrents
  if (!inFlight) {
    inFlight = (async () => {
      try {
        const res = await fetch("/api/auth/session", { credentials: "include" });
        if (!res.ok) {
          console.error("ensureClientSession: échec de la récupération de la session", res.status, res.statusText);
          return null;
        }

        const { session: refreshedSession } = (await res.json()) as {
          session?: { access_token?: string; refresh_token?: string };
        };

        if (!refreshedSession) {
          console.error("ensureClientSession: aucune session retournée par /api/auth/session");
          return null;
        }

        const { access_token, refresh_token } = refreshedSession;

        if (!access_token || !refresh_token) {
          console.error("ensureClientSession: jetons manquants dans la session rafraîchie");
          return null;
        }

        const { data, error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });

        if (error) {
          console.error("ensureClientSession: impossible de définir la session Supabase", error);
          return null;
        }

        return data.session ?? null;
      } catch (error) {
        console.error("ensureClientSession: erreur inattendue lors de la réhydratation", error);
        return null;
      } finally {
        inFlight = null;
      }
    })();
  }
  return inFlight;
}
