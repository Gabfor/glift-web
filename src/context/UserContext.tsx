"use client";

import { createContext, useContext, useEffect, useState } from "react";
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

function computeIsPremium(user: User | null) {
  return (
    !!user &&
    (user.app_metadata?.plan === "premium" ||
      user.user_metadata?.is_premium === true)
  );
}

type UserProviderProps = {
  children: React.ReactNode;
  initialSession?: Session | null;
};

export function UserProvider({ children, initialSession = null }: UserProviderProps) {
  const supabase = useSupabase();
  const [session, setSession] = useState<Session | null>(initialSession);
  const [user, setUser] = useState<User | null>(initialSession?.user ?? null);
  const [isAuthResolved, setIsAuthResolved] = useState<boolean>(!!initialSession);
  const [isPremiumUser, setIsPremiumUser] = useState<boolean>(
    computeIsPremium(initialSession?.user ?? null)
  );

  useEffect(() => {
    let isMounted = true;

    const applySession = (nextSession: Session | null) => {
      if (!isMounted) return;

      const nextUser = nextSession?.user ?? null;
      setSession(nextSession);
      setUser(nextUser);
      setIsPremiumUser(computeIsPremium(nextUser));
      setIsAuthResolved(true);
    };

    const resolveInitialSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (error) {
        console.error("[UserProvider] Unable to resolve initial session", error);
        setIsAuthResolved(true);
        return;
      }

      applySession(data.session ?? null);
    };

    resolveInitialSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        applySession(nextSession);
      }
    );

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

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
