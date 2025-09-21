import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Plan = "premium" | "starter" | "basic" | string | null;

export default function useUserSubscription() {
  const [plan, setPlan] = useState<Plan>(null);
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const supabase = createClient();

    const fetchStatus = async () => {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!alive) return;

      if (!user) {
        setUserId(null);
        setPlan(null);
        setIsPremiumUser(false);
        setLoading(false);
        return;
      }

      setUserId(user.id);

      // 🔧 IMPORTANT : pas de .single() / .maybeSingle() → LIMIT 1 pour éviter le 406 quand 0 ligne
      const { data: rows, error } = await supabase
        .from("user_subscriptions")
        .select("plan")
        .eq("user_id", user.id)
        .limit(1);

      if (!alive) return;

      if (error) {
        // RLS/REST error → on ne bloque pas l'UI, on retombe en non-premium
        setPlan(null);
        setIsPremiumUser(false);
        setLoading(false);
        return;
      }

      const p = (rows?.[0]?.plan ?? null) as Plan;
      setPlan(p);
      setIsPremiumUser(String(p).toLowerCase() === "premium");
      setLoading(false);
    };

    fetchStatus();

    // Refetch sur login/logout
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      fetchStatus();
    });

    return () => {
      alive = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  return { isPremiumUser, loading, userId, plan };
}