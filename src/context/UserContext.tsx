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
    name?: string;
    is_admin?: boolean;
    is_premium?: boolean;
    subscription_plan?: string;
    [key: string]: unknown;
  };
}

interface UserContextType {
  user: CustomUser | null;
  isAuthenticated: boolean;
  isPremiumUser: boolean;
  isLoading: boolean;
  isRecoverySession: boolean;
}

const UserContext = createContext<UserContextType>({
  user: null,
  isAuthenticated: false,
  isPremiumUser: false,
  isLoading: true,
  isRecoverySession: false,
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClientComponentClient();
  const [user, setUser] = useState<CustomUser | null>(null);
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecoverySession, setIsRecoverySession] = useState(false);
  const latestAuthEventRef = useRef<AuthChangeEvent | null>(null);

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

        const { data, error: subscriptionError } = await supabase
          .from("user_subscriptions")
          .select("plan")
          .eq("user_id", customUser.id)
          .single();

        if (subscriptionError && subscriptionError.code !== "PGRST116") {
          throw subscriptionError;
        }

        const planFromSubscription = data?.plan;
        const planFromMetadata = customUser.user_metadata?.subscription_plan;
        const metadataPremiumFlag = Boolean(customUser.user_metadata?.is_premium);

        setIsPremiumUser(
          planFromSubscription === "premium" ||
            planFromMetadata === "premium" ||
            metadataPremiumFlag
        );
      } else {
        setUser(null);
        setIsPremiumUser(false);
      }
    } catch (error) {
      if (!isAuthSessionMissingError(error)) {
        console.error("Erreur lors de la récupération de l'utilisateur", error);
      }

      setUser(null);
      setIsPremiumUser(false);
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
        latestAuthEventRef.current = event;

        if (event === "PASSWORD_RECOVERY") {
          setIsRecoverySession(true);
        }

        const sessionType = session?.type;

        if (sessionType === "recovery") {
          setIsRecoverySession(true);
        } else if (event === "SIGNED_OUT" || event === "SIGNED_IN") {
          setIsRecoverySession(false);
        }

        void fetchUser();
      },
    );

    return () => {
      authListener?.subscription.unsubscribe();
      authClient.setSession = originalSetSession;
    };
  }, [fetchUser, supabase]);

  return (
    <UserContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isPremiumUser,
        isLoading,
        isRecoverySession,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
