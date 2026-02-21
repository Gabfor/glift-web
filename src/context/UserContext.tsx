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
  premiumTrialEndAt: string | null;
  premiumEndAt: string | null;
  trial?: boolean;
  isUserDataLoaded: boolean;
  refreshUser: () => Promise<void>;
  updateUserMetadata: (
    patch: Partial<CustomUser["user_metadata"]>,
  ) => void;
  setOptimisticPremium: (isPremium: boolean) => void;
}

const UserContext = createContext<UserContextType>({
  user: null,
  isAuthenticated: false,
  isPremiumUser: false,
  isLoading: true,
  isRecoverySession: false,
  isEmailVerified: null,
  gracePeriodExpiresAt: null,
  premiumTrialEndAt: null,
  premiumEndAt: null,
  isUserDataLoaded: false,
  refreshUser: async () => { },
  updateUserMetadata: () => { },
  setOptimisticPremium: () => { },
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClientComponentClient();
  const [user, setUser] = useState<CustomUser | null>(null);
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecoverySession, setIsRecoverySession] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState<boolean | null>(null);
  const [gracePeriodExpiresAt, setGracePeriodExpiresAt] = useState<string | null>(null);
  const [premiumTrialEndAt, setPremiumTrialEndAt] = useState<string | null>(null);
  const [premiumEndAt, setPremiumEndAt] = useState<string | null>(null);
  const [trial, setTrial] = useState<boolean | undefined>(undefined);
  const [isUserDataLoaded, setIsUserDataLoaded] = useState(false);
  const latestAuthEventRef = useRef<AuthChangeEvent | null>(null);

  // We no longer restore from session synchronously because reading session.user
  // triggers the Supabase warning. We rely fully on fetchUser() via Supabase Auth server.

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
            setPremiumTrialEndAt(null);
            setPremiumEndAt(null);
            setTrial(undefined);
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
          .select("email_verified, grace_expires_at, subscription_plan, premium_trial_end_at, premium_end_at, trial")
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

        if (profileData && typeof profileData.premium_trial_end_at === "string") {
          setPremiumTrialEndAt(profileData.premium_trial_end_at);
        } else {
          setPremiumTrialEndAt(null);
        }

        if (profileData && typeof profileData.premium_end_at === "string") {
          setPremiumEndAt(profileData.premium_end_at);
        } else {
          setPremiumEndAt(null);
        }

        // Update trial state from profile
        if (profileData && typeof profileData.trial === "boolean") {
          setTrial(profileData.trial);
        } else {
          // Fallback to user_metadata or undefined
          setTrial(customUser.user_metadata?.trial as boolean | undefined);
        }

        // Logic check: if paid period end is passed, force downgrade to starter.
        // NOTE: `trial` is used in DB as "trial already consumed" (historical), not
        // "currently in trial". Using premium_trial_end_at here can incorrectly downgrade
        // paid users who previously had a trial.
        const now = new Date();
        let effectiveIsPremium = planFromProfile === "premium";

        if (effectiveIsPremium) {
          if (profileData?.premium_end_at) {
            // If we have a paid cancellation date, disregard trial date.
            // It is the definitive source for "when does my paid access stop".
            if (new Date(profileData.premium_end_at) < now) {
              effectiveIsPremium = false;
            }
          }
        }

        setIsPremiumUser(effectiveIsPremium);

        // Optional: If we detected an expiration locally but profile says premium, trigger a lazy background update?
        // For now, client-side enforcement is enough for UI.
        const dbIsPremium = planFromProfile === "premium";
        if (dbIsPremium && !effectiveIsPremium) {
          // Detected discrepancy: DB says premium, but dates are expired.
          // Trigger background sync to update DB to 'starter'.
          fetch('/api/user/sync-status', { method: 'POST' })
            .then(res => res.json())
            .then(data => {
              if (data.status === 'active_restored' || data.status === 'downgraded') {
                fetchUser(true); // Refresh in background
              }
            })
            .catch(err => console.error("Background status sync failed", err));
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
          setPremiumTrialEndAt(null);
          setTrial(undefined);
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
          setPremiumTrialEndAt(null);
          setTrial(undefined);
        }
      }
    } finally {
      setIsLoading(false);
      setIsUserDataLoaded(true);
    }
  }, [supabase]);

  useEffect(() => {
    void fetchUser(false);

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
          setPremiumTrialEndAt(null);
          setPremiumEndAt(null);
          setTrial(undefined);
          setIsUserDataLoaded(true); // User is null, so data is "loaded"
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
        premiumTrialEndAt,
        premiumEndAt,
        trial, // Use state value
        isUserDataLoaded,
        refreshUser: fetchUser,
        updateUserMetadata,
        setOptimisticPremium: setIsPremiumUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
