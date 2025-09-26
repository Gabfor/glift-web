"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
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

type UserProviderProps = {
  children: React.ReactNode;
  initialSession?: Session | null;
  initialIsPremiumUser?: boolean;
};

export function UserProvider({
  children,
  initialSession,
  initialIsPremiumUser,
}: UserProviderProps) {
  const supabase = useSupabase();
  const initialSessionProvidedRef = useRef(
    typeof initialSession !== "undefined"
  );
  const initialUserIdRef = useRef(initialSession?.user?.id ?? null);
  const initialPremiumRef = useRef(initialIsPremiumUser === true);

  const [session, setSession] = useState<Session | null>(initialSession ?? null);
  const [user, setUser] = useState<User | null>(initialSession?.user ?? null);
  const [isAuthResolved, setIsAuthResolved] = useState(
    initialSessionProvidedRef.current
  );
  const [isPremiumUser, setIsPremiumUser] = useState(() => {
    const initialUser = initialSession?.user ?? null;
    if (!initialUser) return false;

    if (
      initialUser.app_metadata?.plan === "premium" ||
      initialUser.user_metadata?.is_premium === true
    ) {
      return true;
    }

    return initialPremiumRef.current;
  });

  const sessionAccessTokenRef = useRef<string | null>(
    initialSession?.access_token ?? null
  );

  const applySession = useCallback((nextSession: Session | null) => {
    sessionAccessTokenRef.current = nextSession?.access_token ?? null;
    setSession(nextSession);

    const nextUser = nextSession?.user ?? null;
    setUser(nextUser);

    let premium =
      nextUser?.app_metadata?.plan === "premium" ||
      nextUser?.user_metadata?.is_premium === true;

    if (
      !premium &&
      nextUser &&
      nextUser.id === initialUserIdRef.current &&
      initialPremiumRef.current
    ) {
      premium = true;
    }

    setIsPremiumUser(!!premium);

    if (nextUser) {
      initialUserIdRef.current = nextUser.id;
      initialPremiumRef.current = !!premium;
    } else {
      initialUserIdRef.current = null;
      initialPremiumRef.current = false;
    }
  }, []);

  useEffect(() => {
    let active = true;

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, nextSession) => {
        if (!active) return;

        switch (event) {
          case "INITIAL_SESSION":
          case "SIGNED_IN":
          case "TOKEN_REFRESHED":
            applySession(nextSession);
            setIsAuthResolved(true);
            break;
          case "SIGNED_OUT":
            applySession(null);
            setIsAuthResolved(true);
            break;
        }
      }
    );

    if (!initialSessionProvidedRef.current) {
      supabase.auth.getSession().then(({ data }) => {
        if (!active) return;
        applySession(data.session ?? null);
        setIsAuthResolved(true);
      });
    } else {
      // Keep the singleton client in sync without clobbering the server state.
      supabase.auth.getSession().then(({ data }) => {
        if (!active) return;
        if (!data.session) return;
        if (data.session.access_token === sessionAccessTokenRef.current) return;
        applySession(data.session);
      });
    }

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [
    supabase,
    applySession,
  ]);

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
