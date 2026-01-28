import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/lib/supabase/types";

export class SubscriptionService {
    constructor(private supabase: SupabaseClient<Database>) { }

    async initializeSubscription(userId: string, plan: "basic" | "premium") {
        // Check if subscription exists
        const { data: existingSub, error: fetchError } = await this.supabase
            .from("user_subscriptions")
            .select("user_id")
            .eq("user_id", userId)
            .maybeSingle();

        if (fetchError) {
            throw new Error(`Failed to fetch subscription: ${fetchError.message}`);
        }

        if (existingSub) {
            const { error: updateError } = await this.supabase
                .from("user_subscriptions")
                .update({ plan })
                .eq("user_id", userId);

            if (updateError) throw new Error(`Failed to update subscription: ${updateError.message}`);
        } else {
            const { error: insertError } = await this.supabase
                .from("user_subscriptions")
                .insert({ user_id: userId, plan });

            if (insertError) throw new Error(`Failed to create subscription: ${insertError.message}`);
        }
    }
}
