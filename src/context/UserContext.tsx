"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { createClientComponentClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

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
}

const UserContext = createContext<UserContextType>({
  user: null,
  isAuthenticated: false,
  isPremiumUser: false,
  isLoading: true,
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClientComponentClient();
  const [user, setUser] = useState<CustomUser | null>(null);
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
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
      console.error("Erreur lors de la récupération de l'utilisateur", error);
      setUser(null);
      setIsPremiumUser(false);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      void fetchUser();
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [fetchUser, supabase]);

  return (
    <UserContext.Provider
      value={{
        user,
        isAuthenticated: !!user && !isLoading,
        isPremiumUser,
        isLoading,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
