"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClientComponentClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

// On étend ici le type Supabase User pour inclure user_metadata
interface CustomUser extends User {
  user_metadata: {
    name?: string;
    is_admin?: boolean;
    is_premium?: boolean;
    [key: string]: unknown;
  };
}

interface UserContextType {
  user: CustomUser | null;
  isAuthenticated: boolean;
  isPremiumUser: boolean;
}

const UserContext = createContext<UserContextType>({
  user: null,
  isAuthenticated: false,
  isPremiumUser: false,
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClientComponentClient();
  const [user, setUser] = useState<CustomUser | null>(null);
  const [isPremiumUser, setIsPremiumUser] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const customUser = user as CustomUser;
        setUser(customUser);

        const { data } = await supabase
          .from("user_subscriptions")
          .select("plan")
          .eq("user_id", customUser.id)
          .single();

        setIsPremiumUser(data?.plan === "premium");
      } else {
        setUser(null);
        setIsPremiumUser(false);
      }
    };

    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      fetchUser();
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <UserContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
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
