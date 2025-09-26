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
  const initialSessionRef = useRef(initialSession ?? null);
  const hasSyncedInitialSessionRef = useRef(false);

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
      hasSyncedInitialSessionRef.current = true;
    } else {
      initialUserIdRef.current = null;
      initialPremiumRef.current = false;
      hasSyncedInitialSessionRef.current = false;
    }
  }, []);

  useEffect(() => {
    initialSessionRef.current = initialSession ?? null;
    hasSyncedInitialSessionRef.current = false;
  }, [initialSession, initialSession?.access_token, initialSession?.refresh_token]);

  useEffect(() => {
    let active = true;

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, nextSession) => {
        if (!active) return;

        const shouldSkipInitialNull =
          event === "INITIAL_SESSION" &&
          initialSessionProvidedRef.current &&
          !hasSyncedInitialSessionRef.current &&
          (!nextSession || !nextSession.access_token) &&
          !!initialSessionRef.current?.access_token &&
          !!initialSessionRef.current?.refresh_token;

        if (shouldSkipInitialNull) {
          return;
        }

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
      (async () => {
        const { data } = await supabase.auth.getSession();
        if (!active) return;

        if (data.session) {
          if (data.session.access_token !== sessionAccessTokenRef.current) {
            applySession(data.session);
          } else if (!sessionAccessTokenRef.current) {
            applySession(data.session);
          }
          setIsAuthResolved(true);
          return;
        }

        const serverSession = initialSessionRef.current;
        if (
          !serverSession?.access_token ||
          !serverSession?.refresh_token ||
          hasSyncedInitialSessionRef.current
        ) {
          if (!serverSession?.access_token) {
            setIsAuthResolved(true);
          }
          return;
        }

        hasSyncedInitialSessionRef.current = true;
        applySession(serverSession);
        setIsAuthResolved(true);

        try {
          await supabase.auth.setSession({
            access_token: serverSession.access_token,
            refresh_token: serverSession.refresh_token,
          });
        } catch {
          hasSyncedInitialSessionRef.current = false;
        }
      })();
    }

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [
    supabase,
    applySession,
    initialSession,
    initialSession?.access_token,
    initialSession?.refresh_token,
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
