import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { NextResponse } from "next/server";

export async function GET() {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
        typescript: true,
    });

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
        const { data: { users }, error } = await supabase.auth.admin.listUsers();
        if (error) throw error;

        const results = [];

        for (const user of users) {
            let historyFound = false;
            let stripeData = null;

            // 1. Check existing profile data
            const { data: profile } = await supabase
                .from("profiles")
                .select("premium_trial_end_at, subscription_plan")
                .eq("id", user.id)
                .single();

            if (profile?.premium_trial_end_at || profile?.subscription_plan === 'premium') {
                historyFound = true;
            }

            // 2. Double check with Stripe if needed (more robust)
            const stripeCustomerId = user.app_metadata?.stripe_customer_id;
            if (!historyFound && stripeCustomerId) {
                // Check all subscriptions including canceled ones
                const subscriptions = await stripe.subscriptions.list({
                    customer: stripeCustomerId,
                    status: 'all',
                    limit: 100,
                });

                // If they ever had a subscription with status 'trialing' or past due/active/canceled that was premium
                if (subscriptions.data.length > 0) {
                    historyFound = true;
                    stripeData = "Found Stripe Subscription History";
                }
            }

            if (historyFound) {
                await supabase.from("profiles").update({ trial: true } as any).eq("id", user.id);
                results.push({ email: user.email, status: "Trial Marked True", reason: stripeData || "Profile Data" });
            } else {
                results.push({ email: user.email, status: "Skipped (No History)" });
            }
        }

        return NextResponse.json({ success: true, results });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
