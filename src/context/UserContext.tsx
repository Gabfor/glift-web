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
import { createScopedLogger } from "@/utils/logger";
import { useVisibilityRefetch } from "@/hooks/useVisibilityRefetch";

export type UserContextType = {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isAuthResolved: boolean;
  isPremiumUser: boolean;
  refreshSession: (origin?: string) => Promise<void>;
};

const UserContext = createContext<UserContextType>({
  user: null,
  session: null,
  isAuthenticated: false,
  isAuthResolved: false,
  isPremiumUser: false,
  refreshSession: async () => {},
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
  const logger = createScopedLogger("UserProvider");

  const applySession = useCallback(
    (nextSession: Session | null, origin: string) => {
      const nextUser = nextSession?.user ?? null;

      logger.info("Applying session", {
        origin,
        hasSession: !!nextSession,
        userId: nextUser?.id ?? null,
      });

      setSession(nextSession);
      setUser(nextUser);
      setIsPremiumUser(computeIsPremium(nextUser));
      setIsAuthResolved(true);
    },
    [logger]
  );

  const resolveSession = useCallback(
    async (origin: string) => {
      logger.debug("Resolving session", { origin });

      const { data, error } = await supabase.auth.getSession();

      if (error) {
        logger.error(`Unable to resolve session from ${origin}`, error);
        setIsAuthResolved(true);
        return;
      }

      applySession(data.session ?? null, origin);
    },
    [applySession, logger, supabase]
  );

  const refreshSession = useCallback(
    async (origin = "manual-refresh") => {
      logger.debug("Manual session refresh requested", { origin });
      await resolveSession(origin);
    },
    [logger, resolveSession]
  );

  useEffect(() => {
    let isMounted = true;

    logger.info("Initializing UserContext", {
      hasInitialSession: !!initialSession,
      initialUserId: initialSession?.user?.id ?? null,
    });

    resolveSession("initial-getSession");

    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!isMounted) return;
      logger.info("onAuthStateChange", {
        event,
        hasSession: !!nextSession,
        userId: nextSession?.user?.id ?? null,
      });
      applySession(nextSession, `onAuthStateChange:${event}`);
    });

    const handleStorageEvent = (event: StorageEvent) => {
      if (!isMounted) return;
      if (event.key !== supabase.auth.storageKey) {
        return;
      }

      logger.debug("Storage event detected", {
        key: event.key,
        hasOldValue: !!event.oldValue,
        hasNewValue: !!event.newValue,
      });

      resolveSession("storage-event");
    };

    window.addEventListener("storage", handleStorageEvent);

    return () => {
      isMounted = false;
      window.removeEventListener("storage", handleStorageEvent);
      listener.subscription.unsubscribe();
    };
  }, [applySession, initialSession, logger, resolveSession, supabase]);

  useVisibilityRefetch(
    () => {
      void resolveSession("visibility-change");
    },
    { scope: "UserProvider", triggerOnMount: false }
  );

  return (
    <UserContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!user,
        isAuthResolved,
        isPremiumUser,
        refreshSession,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
