"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useSupabase } from "@/components/SupabaseProvider";

export type UserContextType = {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isAuthResolved: boolean;
  isPremiumUser: boolean;
};

const UserContext = createContext<UserContextType>({
  user: null,
  session: null,
  isAuthenticated: false,
  isAuthResolved: false,
  isPremiumUser: false,
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const supabase = useSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthResolved, setIsAuthResolved] = useState(false);
  const [isPremiumUser, setIsPremiumUser] = useState(false);

  const applySession = useCallback((nextSession: Session | null) => {
    setSession(nextSession);
    const nextUser = nextSession?.user ?? null;
    setUser(nextUser);

    const premium =
      nextUser?.app_metadata?.plan === "premium" ||
      nextUser?.user_metadata?.is_premium === true;
    setIsPremiumUser(premium);
  }, []);

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      applySession(data.session ?? null);
      setIsAuthResolved(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (cancelled) return;
      applySession(nextSession ?? null);
      setIsAuthResolved(true);
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, [supabase, applySession]);

  useEffect(() => {
    let cancelled = false;

    const refreshSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      applySession(data.session ?? null);
      setIsAuthResolved(true);
    };

    const handleFocus = () => {
      void refreshSession();
    };

    const handleVisibility = () => {
      if (!document.hidden) {
        void refreshSession();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [supabase, applySession]);

  return (
    <UserContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!user,
        isAuthResolved,
        isPremiumUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
