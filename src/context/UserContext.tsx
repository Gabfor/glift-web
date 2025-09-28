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

    console.log("[UserProvider] Initializing UserContext", {
      initialSession,
    });

    const applySession = (nextSession: Session | null, origin: string) => {
      if (!isMounted) return;

      const nextUser = nextSession?.user ?? null;
      console.log("[UserProvider] Applying session", {
        origin,
        hasSession: !!nextSession,
        userId: nextUser?.id ?? null,
      });
      setSession(nextSession);
      setUser(nextUser);
      setIsPremiumUser(computeIsPremium(nextUser));
      setIsAuthResolved(true);
    };

    const resolveSession = async (origin: string) => {
      const { data, error } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (error) {
        console.error(`[UserProvider] Unable to resolve session from ${origin}`, error);
        setIsAuthResolved(true);
        return;
      }

      applySession(data.session ?? null, origin);
    };

    resolveSession("initial-getSession");

    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      console.log("[UserProvider] onAuthStateChange", {
        event,
        hasSession: !!nextSession,
        userId: nextSession?.user?.id ?? null,
      });
      applySession(nextSession, "onAuthStateChange");
    });

    const handleStorageEvent = (event: StorageEvent) => {
      if (!isMounted) return;
      if (event.key !== supabase.auth.storageKey) {
        return;
      }

      console.log("[UserProvider] Storage event detected", {
        key: event.key,
        oldValue: event.oldValue,
        newValue: event.newValue,
      });

      resolveSession("storage-event");
    };

    window.addEventListener("storage", handleStorageEvent);

    return () => {
      isMounted = false;
      window.removeEventListener("storage", handleStorageEvent);
      listener.subscription.unsubscribe();
    };
  }, [initialSession, supabase]);

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
