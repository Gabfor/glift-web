// import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
// import { cookies } from "next/headers";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const supabase = await createClient(); // For Auth
        const supabaseAdmin = createAdminClient(); // For DB updates (bypass RLS)

        const {
            data: { user },
            error
        } = await supabase.auth.getUser();

        if (error || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 1. Fetch current profile
        // Cast to any because generated types might be missing stripe_customer_id or causing issues
        const { data: profileData, error: profileError } = await supabaseAdmin
            .from("profiles")
            .select("premium_end_at, premium_trial_end_at, subscription_plan, stripe_customer_id")
            .eq("id", user.id)
            .single();

        if (profileError || !profileData) {
            return NextResponse.json({ error: "Profile not found" }, { status: 404 });
        }

        const profile = profileData as any;

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
            // Add 2-hour grace period for Stripe processing
            if (new Date(profile.premium_trial_end_at).getTime() + 7200000 < now.getTime()) {
                shouldDowngrade = true;
            }
        }

        // 3. Update if expired (Check with Stripe first!)
        if (shouldDowngrade) {
            console.log(`Syncing status for user ${user.id}: DB says expired. Verifying with Stripe...`);

            // Initialize stripe
            const Stripe = (await import("stripe")).default;
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
                typescript: true,
            });

            // Get customer ID
            let stripeCustomerId = profile.stripe_customer_id;

            // RECOVERY: If no Customer ID, try to find by email
            if (!stripeCustomerId && user.email) {
                console.log(`No Customer ID in DB. Searching Stripe by email: ${user.email}`);
                try {
                    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
                    if (customers.data.length > 0) {
                        stripeCustomerId = customers.data[0].id;
                        console.log(`Recovered Customer ID from Stripe: ${stripeCustomerId}. Linking to profile...`);
                        // Link it immediately
                        await supabaseAdmin.from("profiles").update({ stripe_customer_id: stripeCustomerId } as any).eq("id", user.id);
                    }
                } catch (e) {
                    console.error("Error searching customer by email:", e);
                }
            }

            let isActuallyActive = false;

            if (stripeCustomerId) {
                try {
                    console.log(`Checking Stripe for Customer ID: ${stripeCustomerId}`);
                    const subscriptions = await stripe.subscriptions.list({
                        customer: stripeCustomerId,
                        // Removed status: 'active' to see everything
                        limit: 3
                    });

                    const premiumPriceId = process.env.STRIPE_PRICE_ID_PREMIUM;
                    console.log(`Looking for Price ID: ${premiumPriceId}`);

                    if (subscriptions.data.length > 0) {
                        const activeOrTrialingSub = subscriptions.data.find(sub => {
                            const isStatusValid = sub.status === 'active' || sub.status === 'trialing';
                            const hasPremiumPrice = sub.items.data.some((item: any) => item.price.id === premiumPriceId);

                            console.log(`Sub ${sub.id}: Status=${sub.status}, HasPremiumPrice=${hasPremiumPrice}`);
                            return isStatusValid && hasPremiumPrice;
                        });

                        if (activeOrTrialingSub) {
                            isActuallyActive = true;
                            console.log(`Found valid Premium subscription (${activeOrTrialingSub.id})! Updating DB.`);

                            // SELF-HEALING: Update DB dates from Stripe
                            const subAny = activeOrTrialingSub as any;
                            await supabaseAdmin.from("profiles").update({
                                premium_end_at: subAny.cancel_at_period_end ? new Date(subAny.current_period_end * 1000).toISOString() : null,
                                premium_trial_end_at: subAny.trial_end ? new Date(subAny.trial_end * 1000).toISOString() : null,
                                subscription_plan: 'premium',
                                cancellation: subAny.cancel_at_period_end
                            } as any).eq("id", user.id);
                        } else {
                            console.log("No active/trialing premium subscription found in list.");
                        }
                    } else {
                        console.log("No subscriptions found for this customer.");
                    }

                } catch (stripeError) {
                    console.error("Error fetching stripe sub:", stripeError);
                    // If stripe fails, safer to NOT downgrade immediately? Or fallback to DB?
                    // Fallback to DB logic if we can't verify.
                }
            }

            if (!isActuallyActive) {
                console.log(`Confirmed expiration. Downgrading to starter.`);
                const { error: updateError } = await supabaseAdmin
                    .from("profiles")
                    .update({
                        subscription_plan: 'starter',
                        cancellation: false,
                        // premium_end_at: null, // Optionally clear these to avoid confusion?
                        // premium_trial_end_at: null
                    } as any)
                    .eq("id", user.id);

                if (updateError) throw updateError;
                return NextResponse.json({ status: 'downgraded' });
            } else {
                return NextResponse.json({ status: 'active_restored' });
            }
        }

        return NextResponse.json({ status: 'active' });

    } catch (error) {
        console.error("Sync status error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
