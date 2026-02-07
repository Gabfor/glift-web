"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createClientComponentClient } from "@/lib/supabase/client";
import { isAuthSessionMissingError } from "@supabase/auth-js";
import { AuthChangeEvent, User } from "@supabase/supabase-js";
import { useSessionContext } from "@supabase/auth-helpers-react";

// On étend ici le type Supabase User pour inclure user_metadata
interface CustomUser extends User {
  user_metadata: {
    name?: string | null;
    is_admin?: boolean | null;
    is_premium?: boolean | null;
    subscription_plan?: string | null;
    avatar_url?: string | null;
    avatar_path?: string | null;
    [key: string]: unknown;
  };
}

interface UserContextType {
  user: CustomUser | null;
  isAuthenticated: boolean;
  isPremiumUser: boolean;
  isLoading: boolean;
  isRecoverySession: boolean;
  isEmailVerified: boolean | null;
  gracePeriodExpiresAt: string | null;
  refreshUser: () => Promise<void>;
  updateUserMetadata: (
    patch: Partial<CustomUser["user_metadata"]>,
  ) => void;
}

const UserContext = createContext<UserContextType>({
  user: null,
  isAuthenticated: false,
  isPremiumUser: false,
  isLoading: true,
  isRecoverySession: false,
  isEmailVerified: null,
  gracePeriodExpiresAt: null,
  refreshUser: async () => { },
  updateUserMetadata: () => { },
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClientComponentClient();
  const { session } = useSessionContext();
  const sessionUser = (session?.user as CustomUser) ?? null;

  const [user, setUser] = useState<CustomUser | null>(() => sessionUser);
  /* 
   * SIMPLIFICATION (Antigravity):
   * Initialisation depuis les métadonnées de session pour éviter le flicker.
   * La valeur définitive sera confirmée par fetchUser -> profiles table.
   */
  const [isPremiumUser, setIsPremiumUser] = useState(() => {
    return sessionUser?.user_metadata?.subscription_plan === 'premium';
  });
  const [isLoading, setIsLoading] = useState(() => !sessionUser);
  const [isRecoverySession, setIsRecoverySession] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState<boolean | null>(() => {
    if (!sessionUser) {
      return null;
    }

    return typeof sessionUser.email_confirmed_at === "string";
  });
  const [gracePeriodExpiresAt, setGracePeriodExpiresAt] = useState<string | null>(null);
  const latestAuthEventRef = useRef<AuthChangeEvent | null>(null);

  useEffect(() => {
    if (!sessionUser) {
      setGracePeriodExpiresAt(null);
      return;
    }

    // Prevent restoring user from stale session context if we just signed out
    if (latestAuthEventRef.current === "SIGNED_OUT") {
      return;
    }

    setUser((current) => {
      if (current?.id === sessionUser.id) {
        return current;
      }

      return sessionUser;
    });

    // On ne met plus à jour isPremiumUser depuis sessionUser (métadonnées)
    // On attend que fetchUser récupère la donnée fraîche de la table profiles

    // On ne met plus à jour isPremiumUser depuis sessionUser (métadonnées)
    // On attend que fetchUser récupère la donnée fraîche de la table profiles

    // SIMPLIFICATION (Antigravity):
    // Also stop updating isEmailVerified from sessionUser here, because it flickers
    // if Supabase auth says "verified" but profiles table says "not verified".
    // fetchUser will handle the source of truth from profiles table.
    /*
    setIsEmailVerified((current) => {
      if (current === true) {
        return current;
      }

      return typeof sessionUser.email_confirmed_at === "string";
    });
    */
  }, [sessionUser]);

  const fetchUser = useCallback(async (background = false) => {
    if (!background) {
      setIsLoading(true);
    }
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        if (isAuthSessionMissingError(error)) {
          // Even for missing session error, if we are in background mode (e.g. focus), 
          // we should be careful not to log out immediately if it's a transient issue.
          // However, "Auth session missing" usually means strictly no token.
          // But to be super safe against flicker:
          if (!background) {
            setUser(null);
            setIsPremiumUser(false);
          }
          return;
        }

        throw error;
      }

      if (user) {
        const customUser = user as CustomUser;
        setUser(customUser);

        /* 
         * SIMPLIFICATION (Antigravity):
         * On ne récupère plus user_subscriptions.
         * On récupère subscription_plan directement depuis la table profiles.
         */
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("email_verified, grace_expires_at, subscription_plan")
          .eq("id", customUser.id)
          .maybeSingle();

        if (profileError && profileError.code !== "PGRST116") {
          throw profileError;
        }

        // Source de vérité unique : table profiles
        const planFromProfile = profileData?.subscription_plan;
        setIsPremiumUser(planFromProfile === "premium");

        if (profileData && typeof profileData.email_verified === "boolean") {
          setIsEmailVerified(profileData.email_verified);
        } else {
          setIsEmailVerified(
            typeof customUser.email_confirmed_at === "string"
          );
        }

        if (profileData && typeof profileData.grace_expires_at === "string") {
          setGracePeriodExpiresAt(profileData.grace_expires_at);
        } else {
          setGracePeriodExpiresAt(null);
        }
      } else {
        // If we are refreshing in the background (e.g. on focus), don't log out the user if getUser returns null.
        // The only way to log out should be explicit SIGNED_OUT event or fatal error.
        // This prevents flickering on tab switch or token refresh.
        if (!background) {
          setUser(null);
          setIsPremiumUser(false);
          setIsEmailVerified(null);
          setGracePeriodExpiresAt(null);
        }
      }
    } catch (error) {
      if (!isAuthSessionMissingError(error)) {
        console.error("Erreur lors de la récupération de l'utilisateur", error);
        // Do not clear user here if it's just a profile fetch error or transient network error
        // forcing a logout on every error causes flickering.
        // We only clear if we specifically suspect auth is gone, but isAuthSessionMissingError checks that.
        // If we are here, it's likely a network error or DB error.
        // Better to keep stale user than to flash a logout state.
      } else {
        // If background refresh occurs (e.g. on focus), do not clear the user if we have an error that might be transient
        // Wait for explicit SIGNED_OUT from listener.
        if (!background) {
          setUser(null);
          setIsPremiumUser(false);
          setIsEmailVerified(null);
          setGracePeriodExpiresAt(null);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void fetchUser(!!sessionUser);

    const authClient = supabase.auth;

    const extractSessionType = (value: unknown): string | undefined => {
      if (!value || typeof value !== "object") {
        return undefined;
      }

      const payload = value as Record<string, unknown>;

      const directType = payload.type;
      if (typeof directType === "string") {
        return directType;
      }

      const nestedSession = payload.session;
      if (nestedSession && typeof nestedSession === "object") {
        const nestedType = (nestedSession as Record<string, unknown>).type;
        if (typeof nestedType === "string") {
          return nestedType;
        }
      }

      return undefined;
    };

    const originalSetSession = authClient.setSession;

    const patchedSetSession = (async (
      ...args: Parameters<typeof authClient.setSession>
    ) => {
      const [sessionLike] = args;
      const maybeType = extractSessionType(sessionLike);

      if (maybeType === "recovery") {
        setIsRecoverySession(true);
      }

      return originalSetSession.apply(authClient, args);
    }) as typeof authClient.setSession;

    authClient.setSession = patchedSetSession;

    const { data: authListener } = authClient.onAuthStateChange(
      (event, session) => {
        const previousEvent = latestAuthEventRef.current;

        if (event === "PASSWORD_RECOVERY") {
          setIsRecoverySession(true);
        }

        const sessionType = extractSessionType(session);

        if (sessionType === "recovery") {
          setIsRecoverySession(true);
        } else if (event === "SIGNED_OUT") {
          setIsRecoverySession(false);
          setUser(null);
          setIsPremiumUser(false);
          setIsEmailVerified(null);
          setGracePeriodExpiresAt(null);
        } else if (
          event === "SIGNED_IN" &&
          sessionType !== "recovery" &&
          previousEvent !== "PASSWORD_RECOVERY"
        ) {
          setIsRecoverySession(false);
        }

        latestAuthEventRef.current = event;

        // SIMPLIFICATION (Antigravity):
        // Avoid re-fetching user on TOKEN_REFRESHED if we already have a user.
        // This reduces flicker potential on tab focus.
        // We only fetch if it's SIGNED_IN, USER_UPDATED, or INITIAL_SESSION (implicitly handled by mount)
        // or if we don't have a user yet.
        if (event === 'TOKEN_REFRESHED' && user) {
          return;
        }

        void fetchUser(true);
      },
    );

    return () => {
      authListener?.subscription.unsubscribe();
      authClient.setSession = originalSetSession;
    };
  }, [fetchUser, supabase]);

  const updateUserMetadata = useCallback(
    (patch: Partial<CustomUser["user_metadata"]>) => {
      setUser((current) => {
        if (!current) {
          return current;
        }

        const nextMetadataEntries = Object.entries(patch);
        if (nextMetadataEntries.length === 0) {
          return current;
        }

        const nextMetadata = { ...current.user_metadata } as Record<
          string,
          unknown
        >;

        for (const [key, value] of nextMetadataEntries) {
          if (typeof value === "undefined") {
            delete nextMetadata[key];
          } else {
            nextMetadata[key] = value;
          }
        }

        return {
          ...current,
          user_metadata: nextMetadata as CustomUser["user_metadata"],
        };
      });
    },
    [],
  );

  return (
    <UserContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isPremiumUser,
        isLoading,
        isRecoverySession,
        isEmailVerified,
        gracePeriodExpiresAt,
        refreshUser: fetchUser,
        updateUserMetadata,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
