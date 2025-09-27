"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
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

  const recoverSession = useCallback(async () => {
    const { data, error } = await supabase.auth.getSession();

    if (data.session) {
      return data.session;
    }

    if (error) {
      console.warn("Failed to fetch session", error);
    }

    const { data: refreshed, error: refreshError } =
      await supabase.auth.refreshSession();

    if (refreshError) {
      console.warn("Failed to refresh session", refreshError);
      return null;
    }

    return refreshed.session ?? null;
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;

    const syncSession = async () => {
      const nextSession = await recoverSession();
      if (cancelled) return;
      applySession(nextSession);
      setIsAuthResolved(true);
    };

    void syncSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (cancelled) return;
        applySession(nextSession ?? null);
        setIsAuthResolved(true);
      }
    );

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, [supabase, applySession, recoverSession]);

  useEffect(() => {
    let cancelled = false;

    const refreshOnVisibility = async () => {
      const nextSession = await recoverSession();
      if (cancelled) return;
      applySession(nextSession);
      setIsAuthResolved(true);
    };

    const handleFocus = () => {
      void refreshOnVisibility();
    };

    const handleVisibility = () => {
      if (!document.hidden) {
        void refreshOnVisibility();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [recoverSession, applySession]);

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
