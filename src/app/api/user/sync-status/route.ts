// import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
// import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
            error
        } = await supabase.auth.getUser();

        if (error || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 1. Fetch current profile
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("premium_end_at, premium_trial_end_at, subscription_plan")
            .eq("id", user.id)
            .single();

        if (profileError || !profile) {
            return NextResponse.json({ error: "Profile not found" }, { status: 404 });
        }

        if (profile.subscription_plan !== 'premium') {
            return NextResponse.json({ status: 'already_starter' });
        }

        // 2. Verified expiration logic server-side
        const now = new Date();
        let shouldDowngrade = false;

        if (profile.premium_end_at) {
            if (new Date(profile.premium_end_at) < now) {
                shouldDowngrade = true;
            }
        } else if (profile.premium_trial_end_at) {
            if (new Date(profile.premium_trial_end_at) < now) {
                shouldDowngrade = true;
            }
        }

        // 3. Update if expired
        if (shouldDowngrade) {
            console.log(`Syncing status for user ${user.id}: Downgrading to starter due to expiration.`);
            const { error: updateError } = await supabase
                .from("profiles")
                .update({
                    subscription_plan: 'starter',
                    cancellation: false, // Reset cancellation flag
                    // Optional: keep dates for history or clear them? Warning: clearing them loses history.
                    // Better keep them.
                } as any)
                .eq("id", user.id);

            if (updateError) throw updateError;

            return NextResponse.json({ status: 'downgraded' });
        }

        return NextResponse.json({ status: 'active' });

    } catch (error) {
        console.error("Sync status error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
