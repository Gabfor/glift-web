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
  refreshUser: async () => {},
  updateUserMetadata: () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClientComponentClient();
  const { session } = useSessionContext();
  const sessionUser = (session?.user as CustomUser) ?? null;

  const [user, setUser] = useState<CustomUser | null>(() => sessionUser);
  const [isPremiumUser, setIsPremiumUser] = useState(() => {
    if (!sessionUser) {
      return false;
    }

    const metadataPremiumFlag = Boolean(sessionUser.user_metadata?.is_premium);
    const planFromMetadata = sessionUser.user_metadata?.subscription_plan;

    return metadataPremiumFlag || planFromMetadata === "premium";
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

    setUser((current) => {
      if (current?.id === sessionUser.id) {
        return current;
      }

      return sessionUser;
    });

    setIsPremiumUser((current) => {
      if (current) {
        return current;
      }

      const metadataPremiumFlag = Boolean(sessionUser.user_metadata?.is_premium);
      const planFromMetadata = sessionUser.user_metadata?.subscription_plan;

      return metadataPremiumFlag || planFromMetadata === "premium";
    });

    setIsEmailVerified((current) => {
      if (current === true) {
        return current;
      }

      return typeof sessionUser.email_confirmed_at === "string";
    });
  }, [sessionUser]);

  const fetchUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        if (isAuthSessionMissingError(error)) {
          setUser(null);
          setIsPremiumUser(false);
          return;
        }

        throw error;
      }

      if (user) {
        const customUser = user as CustomUser;
        setUser(customUser);

        const [subscriptionResult, profileResult] = await Promise.all([
          supabase
            .from("user_subscriptions")
            .select("plan")
            .eq("user_id", customUser.id)
            .maybeSingle(),
          supabase
            .from("profiles")
            .select("email_verified, grace_expires_at")
            .eq("id", customUser.id)
            .maybeSingle(),
        ]);

        const { data: subscriptionData, error: subscriptionError } =
          subscriptionResult;

        if (subscriptionError && subscriptionError.code !== "PGRST116") {
          throw subscriptionError;
        }

        const { data: profileData, error: profileError } = profileResult;

        if (profileError && profileError.code !== "PGRST116") {
          throw profileError;
        }

        const planFromSubscription = subscriptionData?.plan;
        const planFromMetadata = customUser.user_metadata?.subscription_plan;
        const metadataPremiumFlag = Boolean(customUser.user_metadata?.is_premium);

        setIsPremiumUser(
          planFromSubscription === "premium" ||
            planFromMetadata === "premium" ||
            metadataPremiumFlag
        );

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
        setUser(null);
        setIsPremiumUser(false);
        setIsEmailVerified(null);
        setGracePeriodExpiresAt(null);
      }
    } catch (error) {
      if (!isAuthSessionMissingError(error)) {
        console.error("Erreur lors de la récupération de l'utilisateur", error);
      }

      setUser(null);
      setIsPremiumUser(false);
      setIsEmailVerified(null);
      setGracePeriodExpiresAt(null);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void fetchUser();

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
        } else if (
          event === "SIGNED_IN" &&
          sessionType !== "recovery" &&
          previousEvent !== "PASSWORD_RECOVERY"
        ) {
          setIsRecoverySession(false);
        }

        latestAuthEventRef.current = event;

        void fetchUser();
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
