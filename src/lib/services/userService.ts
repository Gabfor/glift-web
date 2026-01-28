import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/lib/supabase/types";

export class UserService {
    constructor(private supabase: SupabaseClient<Database>) { }

    async createOrUpdateProfile(
        userId: string,
        data: {
            name: string;
            plan: "basic" | "premium";
        }
    ) {
        const { name, plan } = data;
        const GRACE_PERIOD_HOURS = 72;
        const graceExpiresAt = new Date(
            Date.now() + GRACE_PERIOD_HOURS * 60 * 60 * 1000
        ).toISOString();
        const trialStartedAt = plan === "premium" ? new Date().toISOString() : null;

        // Check if profile exists
        const { data: existingProfile, error: fetchError } = await this.supabase
            .from("profiles")
            .select("id, premium_trial_started_at")
            .eq("id", userId)
            .maybeSingle();

        if (fetchError) {
            throw new Error(`Failed to fetch profile: ${fetchError.message}`);
        }

        if (!existingProfile) {
            // Insert new profile
            const { error: insertError } = await this.supabase.from("profiles").insert({
                id: userId,
                name,
                email_verified: false,
                grace_expires_at: graceExpiresAt,
                subscription_plan: plan,
                premium_trial_started_at: trialStartedAt,
            });

            if (insertError) throw new Error(`Failed to create profile: ${insertError.message}`);
        } else {
            // Update existing profile
            const { error: updateError } = await this.supabase
                .from("profiles")
                .update({
                    name,
                    email_verified: false,
                    subscription_plan: plan,
                    // Only update trial start if switching to premium and not already set? 
                    // Logic from original: 
                    // profileUpdatePayload.premium_trial_started_at = supabasePlan === "premium" ? existingProfile.premium_trial_started_at ?? trialStartTimestamp : null;
                    premium_trial_started_at:
                        plan === "premium"
                            ? existingProfile.premium_trial_started_at ?? trialStartedAt
                            : null,
                })
                .eq("id", userId);

            if (updateError) throw new Error(`Failed to update profile: ${updateError.message}`);
        }
    }

    async initializePreferences(userId: string) {
        // Check if preferences exist
        const { data: existingPrefs, error: fetchError } = await this.supabase
            .from("preferences")
            .select("id")
            .eq("id", userId)
            .maybeSingle();

        if (fetchError) throw new Error(`Failed to fetch preferences: ${fetchError.message}`);

        if (!existingPrefs) {
            const { error: insertError } = await this.supabase
                .from("preferences")
                .insert({ id: userId });

            if (insertError) throw new Error(`Failed to create preferences: ${insertError.message}`);
        }
    }
}
