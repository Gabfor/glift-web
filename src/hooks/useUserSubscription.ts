import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";

export default function useUserSubscription() {
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsPremiumUser(false);
        setLoading(false);
        return;
      }

      setUserId(user.id);

      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("plan")
        .eq("user_id", user.id)
        .single();

      if (error || !data) {
        setIsPremiumUser(false); // fallback: basic
      } else {
        setIsPremiumUser(data.plan === "premium");
      }

      setLoading(false);
    };

    fetchStatus();
  }, []);

  return { isPremiumUser, loading, userId };
}
