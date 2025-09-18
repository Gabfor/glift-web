"use client";

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabaseClient";

type AuthCtx = {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isAuthResolved: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  user: null,
  session: null,
  isAuthenticated: false,
  isAuthResolved: false,
  refresh: async () => {},
  signOut: async () => {},
});

function purgeAuthStorage() {
  try { sessionStorage.removeItem("glift-auth-token"); } catch {}
  try { localStorage.removeItem("glift-auth-token"); } catch {}
  try {
    const ks: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.includes("auth-token") || k.startsWith("sb-") || k.startsWith("supabase"))) ks.push(k);
    }
    ks.forEach(k => { try { localStorage.removeItem(k); } catch {} });
  } catch {}
  try {
    const ks: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && (k.includes("auth-token") || k.startsWith("sb-") || k.startsWith("supabase"))) ks.push(k);
    }
    ks.forEach(k => { try { sessionStorage.removeItem(k); } catch {} });
  } catch {}
}

function repeatedPurge(frames = 8) {
  let n = 0;
  const tick = () => {
    purgeAuthStorage();
    n += 1;
    if (n < frames) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthResolved, setIsAuthResolved] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      // 1) Vérifie la session en local (rapide, évite le faux "déconnecté")
      const local = await supabase.auth.getSession();
      if (!alive) return;

      if (local.data.session) {
        setSession(local.data.session);
        setUser(local.data.session.user);
        setIsAuthResolved(true);
        return;
      }

      // 2) Pas de session locale → essaie de récupérer celle du serveur
      try {
        const r = await fetch("/api/auth/session", { credentials: "include", cache: "no-store" });
        if (!alive) return;

        if (r.ok) {
          const json = await r.json().catch(() => null);
          const srv = json?.session;
          if (srv?.access_token && srv?.refresh_token) {
            const { data: setRes } = await supabase.auth.setSession({
              access_token: srv.access_token,
              refresh_token: srv.refresh_token,
            });
            setSession(setRes.session ?? null);
            setUser(setRes.session?.user ?? null);
          } else {
            // Réponse valide mais vide → purge (on est sûr qu'il n'y a pas de session)
            repeatedPurge();
          }
        } else {
          // Erreur HTTP (ex: 500) → on n'affirme pas "pas de session" (pas de purge agressive)
        }
      } catch {
        // Erreur réseau → idem, pas de purge agressive
      } finally {
        if (alive) setIsAuthResolved(true);
      }
    })();

    // 3) S'abonner aux changements d'auth
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s ?? null);
      setUser(s?.user ?? null);
      if (!s) repeatedPurge();
      setIsAuthResolved(true);
    });

    return () => {
      alive = false;
      try {
        sub?.subscription?.unsubscribe?.();
      } catch {}
    };
  }, [supabase]);

  useEffect(() => {
    if (isAuthResolved && !user) repeatedPurge();
  }, [isAuthResolved, user]);

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    setSession(data.session ?? null);
    setUser(data.session?.user ?? null);
    if (!data.session) repeatedPurge();
    setIsAuthResolved(true);
  }, [supabase]);

  const signOut = useCallback(async () => {
    try { await supabase.auth.signOut(); } catch {}
    repeatedPurge();
    window.location.assign("/deconnexion");
  }, [supabase]);

  const value = useMemo(
    () => ({
      user,
      session,
      isAuthenticated: !!user,
      isAuthResolved,
      refresh,
      signOut,
    }),
    [user, session, isAuthResolved, refresh, signOut]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useUser = () => useContext(Ctx);
