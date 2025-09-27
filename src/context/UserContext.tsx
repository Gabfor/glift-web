"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useSupabase } from "@/components/SupabaseProvider";
import { ensureClientSession } from "@/lib/ensureClientSession";

export type UserContextType = {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isAuthResolved: boolean;
  plan: string | null;
  isPremiumUser: boolean;
  isSubscriptionResolved: boolean;
};

const UserContext = createContext<UserContextType>({
  user: null,
  session: null,
  isAuthenticated: false,
  isAuthResolved: false,
  plan: null,
  isPremiumUser: false,
  isSubscriptionResolved: false,
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const supabase = useSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthResolved, setIsAuthResolved] = useState(false);
  const [plan, setPlan] = useState<string | null>(null);
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [isSubscriptionResolved, setIsSubscriptionResolved] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let fetchToken = 0;

    const applyPlan = (nextPlan: string | null, nextPremium?: boolean) => {
      if (!isMounted) return;
      setPlan(nextPlan);
      if (typeof nextPremium === "boolean") {
        setIsPremiumUser(nextPremium);
      } else {
        setIsPremiumUser(String(nextPlan).toLowerCase() === "premium");
      }
    };

    const fetchPlanForUser = async (userId: string | null) => {
      const currentToken = ++fetchToken;

      if (!userId) {
        applyPlan(null, false);
        setIsSubscriptionResolved(true);
        return;
      }

      const { data: rows, error } = await supabase
        .from("user_subscriptions")
        .select("plan")
        .eq("user_id", userId)
        .limit(1);

      if (!isMounted || currentToken !== fetchToken) {
        return;
      }

      if (error) {
        applyPlan(null, false);
        setIsSubscriptionResolved(true);
        return;
      }

      const nextPlan = (rows?.[0]?.plan ?? null) as string | null;
      applyPlan(nextPlan, String(nextPlan).toLowerCase() === "premium");
      setIsSubscriptionResolved(true);
    };

    const updateFromSession = (currentSession: Session | null) => {
      if (!isMounted) return;

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      const currentUser = currentSession?.user ?? null;

      if (!currentUser) {
        fetchToken++;
        applyPlan(null, false);
        setIsSubscriptionResolved(true);
        return;
      }

      const appPlan =
        typeof currentUser.app_metadata?.plan === "string"
          ? (currentUser.app_metadata.plan as string)
          : null;

      const userMetadata = (currentUser.user_metadata ?? {}) as Record<
        string,
        unknown
      >;
      const metadataPlanValue = userMetadata?.["plan"];
      const metadataPlan =
        appPlan ??
        (typeof metadataPlanValue === "string" ? metadataPlanValue : null);

      const metadataPremium =
        String(metadataPlan).toLowerCase() === "premium" ||
        userMetadata?.["is_premium"] === true;

      applyPlan(metadataPlan ?? null, metadataPremium);
      setIsSubscriptionResolved(false);

      void fetchPlanForUser(currentUser.id);
    };

    const resolveSession = async () => {
      const ensuredSession = await ensureClientSession(supabase);
      if (!isMounted) return;

      if (ensuredSession) {
        updateFromSession(ensuredSession);
        if (isMounted) {
          setIsAuthResolved(true);
        }
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;

      updateFromSession(data.session ?? null);
      setIsAuthResolved(true);
    };

    void resolveSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      updateFromSession(nextSession);
      if (isMounted) {
        setIsAuthResolved(true);
      }
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <UserContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!user,
        isAuthResolved,
        plan,
        isPremiumUser,
        isSubscriptionResolved,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
