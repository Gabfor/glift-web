"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useSupabase } from "@/components/SupabaseProvider";
import { ensureClientSession } from "@/lib/ensureClientSession";

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

  useEffect(() => {
    let isMounted = true;

    const updateFromSession = (currentSession: Session | null) => {
      if (!isMounted) return;

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      const premium =
        currentSession?.user?.app_metadata?.plan === "premium" ||
        currentSession?.user?.user_metadata?.is_premium === true;
      setIsPremiumUser(premium);
    };

    const resolveSession = async () => {
      const ensuredSession = await ensureClientSession(supabase);
      if (!isMounted) return;

      if (ensuredSession) {
        updateFromSession(ensuredSession);
        if (isMounted) {
          setIsAuthResolved(true);
        }
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;

      updateFromSession(data.session ?? null);
      setIsAuthResolved(true);
    };

    void resolveSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      updateFromSession(nextSession);
      if (isMounted) {
        setIsAuthResolved(true);
      }
    });

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
