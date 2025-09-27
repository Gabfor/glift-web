import { useUser } from "@/context/UserContext";

type Plan = "premium" | "starter" | "basic" | string | null;

export default function useUserSubscription() {
  const { user, plan, isPremiumUser, isSubscriptionResolved } = useUser();

  return {
    plan: (plan ?? null) as Plan,
    isPremiumUser,
    userId: user?.id ?? null,
    loading: !isSubscriptionResolved,
  };
}
