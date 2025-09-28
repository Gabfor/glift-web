"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import { useSupabase } from "@/components/SupabaseProvider";
import { createScopedLogger } from "@/utils/logger";
import { useVisibilityRefetch } from "@/hooks/useVisibilityRefetch";

type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

export type UserContextType = {
  supabase: SupabaseClient;
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isAuthResolved: boolean;
  isPremiumUser: boolean;
  status: AuthStatus;
  sessionVersion: number;
  lastRefreshAt: number | null;
  refreshSession: (reason?: string) => Promise<void>;
};

const UserContext = createContext<UserContextType>({
  supabase: undefined as unknown as SupabaseClient,
  user: null,
  session: null,
  isAuthenticated: false,
  isAuthResolved: false,
  isPremiumUser: false,
  status: "idle",
  sessionVersion: 0,
  lastRefreshAt: null,
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
  const logger = useMemo(() => createScopedLogger("UserProvider"), []);
  const [session, setSession] = useState<Session | null>(initialSession);
  const [user, setUser] = useState<User | null>(initialSession?.user ?? null);
  const [isAuthResolved, setIsAuthResolved] = useState<boolean>(!!initialSession);
  const [isPremiumUser, setIsPremiumUser] = useState<boolean>(
    computeIsPremium(initialSession?.user ?? null)
  );
  const [status, setStatus] = useState<AuthStatus>(
    initialSession ? "authenticated" : "idle"
  );
  const [sessionVersion, setSessionVersion] = useState<number>(0);
  const [lastRefreshAt, setLastRefreshAt] = useState<number | null>(
    initialSession ? Date.now() : null
  );
  const refreshLockRef = useRef<Promise<void> | null>(null);

  const applySession = useCallback(
    (nextSession: Session | null, origin: string) => {
      const nextUser = nextSession?.user ?? null;
      logger.info("applySession", {
        origin,
        hasSession: !!nextSession,
        userId: nextUser?.id ?? null,
      });
      setSession(nextSession);
      setUser(nextUser);
      setIsPremiumUser(computeIsPremium(nextUser));
      setIsAuthResolved(true);
      setStatus(nextUser ? "authenticated" : "unauthenticated");
      setSessionVersion((prev) => prev + 1);
      setLastRefreshAt(Date.now());
    },
    [logger]
  );

  const refreshSession = useCallback(
    async (reason = "manual") => {
      if (refreshLockRef.current) {
        logger.debug("refreshSession:reuse", { reason });
        return refreshLockRef.current;
      }
      const promise = (async () => {
        logger.debug("refreshSession:start", { reason });
        setStatus((prev) => (prev === "loading" ? prev : "loading"));
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          logger.error("refreshSession:error", error);
          applySession(null, `refresh-error:${reason}`);
          return;
        }
        applySession(data.session ?? null, `refresh:${reason}`);
      })()
        .catch((error) => {
          logger.error("refreshSession:exception", error);
          applySession(null, `refresh-exception:${reason}`);
        })
        .finally(() => {
          refreshLockRef.current = null;
        });
      refreshLockRef.current = promise;
      await promise;
    },
    [applySession, logger, supabase]
  );

  useEffect(() => {
    if (initialSession) {
      applySession(initialSession, "initial-session");
      return;
    }
    void refreshSession("bootstrap");
  }, [applySession, initialSession, refreshSession]);

  useEffect(() => {
    const channel = new BroadcastChannel("glift-auth");
    channel.onmessage = (event) => {
      if (event.data === "session:updated") {
        console.log("[UserProvider] broadcast received", {
          status,
          sessionVersion,
        });
        void refreshSession("broadcast");
      }
    };

    const handleStorageEvent = (event: StorageEvent) => {
      if (!event.key) {
        return;
      }
      const key = event.key.toLowerCase();
      if (key.includes("sb-") || key.includes("auth")) {
        console.log("[UserProvider] storage event", {
          key: event.key,
          status,
          sessionVersion,
        });
        void refreshSession("storage");
      }
    };

    window.addEventListener("storage", handleStorageEvent);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      console.log("[UserProvider] onAuthStateChange", {
        event,
        hasSession: !!nextSession,
        sessionVersion,
      });
      applySession(nextSession, `onAuthStateChange:${event}`);
      channel.postMessage("session:updated");
    });

    return () => {
      window.removeEventListener("storage", handleStorageEvent);
      subscription.unsubscribe();
      channel.close();
    };
  }, [applySession, refreshSession, sessionVersion, status, supabase]);

  const handleVisibilityRefresh = useCallback(() => {
    console.log("[UserProvider] visibility trigger", {
      status,
      sessionVersion,
    });
    void refreshSession("visibility");
  }, [refreshSession, sessionVersion, status]);

  useVisibilityRefetch(handleVisibilityRefresh, 1200);

  const value = useMemo(
    () => ({
      supabase,
      user,
      session,
      isAuthenticated: status === "authenticated",
      isAuthResolved,
      isPremiumUser,
      status,
      sessionVersion,
      lastRefreshAt,
      refreshSession,
    }),
    [
      isAuthResolved,
      isPremiumUser,
      lastRefreshAt,
      refreshSession,
      session,
      sessionVersion,
      status,
      supabase,
      user,
    ]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}
