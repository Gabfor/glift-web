import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

// Force dynamic to avoid caching
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        // Init Stripe
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
            typescript: true,
            apiVersion: "2023-10-16"
        });

        // Init Supabase Admin
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Fetch specific user by email (ID lookup failed?)
        // Note: profiles table might not have email column directly exposed if it's via auth? 
        // Wait, profiles usually has ID matching auth.users.
        // Let's filter by listing all and checking email in loop if we can't join.
        // Actually, the previous version listed profiles and THEN fetched email from auth admin.
        // So I cannot filter profiles by email directly if email is not in profiles table.
        // I will revert to listing 50 and filtering in code for the specific email.

        const { data: profiles, error } = await supabase
            .from("profiles")
            .select("*")
            .order("updated_at", { ascending: false })
            .limit(100) as { data: any[], error: any };

        if (error) throw error;

        const report = [];
        const premiumPriceId = process.env.STRIPE_PRICE_ID_PREMIUM;

        for (const profile of profiles) {
            let stripeData: any[] | string | null = null;
            let status = "No Customer ID";
            let email = "Unknown";
            let stripeCustomerByEmail = null;

            // Get Email from Auth
            const { data: userData } = await supabase.auth.admin.getUserById(profile.id);
            if (userData.user) {
                email = userData.user.email || "No Email";
            }

            // Phase 1: Check by ID
            if (profile.stripe_customer_id) {
                try {
                    const subs = await stripe.subscriptions.list({
                        customer: profile.stripe_customer_id,
                        limit: 5
                    });

                    stripeData = subs.data.map(sub => ({
                        id: sub.id,
                        status: sub.status,
                        current_period_end: new Date((sub as any).current_period_end * 1000).toISOString(),
                        cancel_at_period_end: sub.cancel_at_period_end,
                        items: sub.items.data.map((i: any) => ({ priceId: i.price.id, productId: i.price.product }))
                    }));

                    const activeOrTrialingSub = subs.data.find(sub => {
                        const isStatusValid = sub.status === 'active' || sub.status === 'trialing';
                        const hasPremiumPrice = sub.items.data.some((item: any) => item.price.id === premiumPriceId);
                        return isStatusValid && hasPremiumPrice;
                    });

                    status = activeOrTrialingSub ? "VALID PREMIUM FOUND (By ID)" : "NO VALID PREMIUM (By ID)";

                } catch (e: any) {
                    stripeData = "Error: " + e.message;
                }
            }

            // Phase 2: Check by Email if ID missing or invalid
            if ((status === "No Customer ID" || status.includes("NO VALID")) && email !== "Unknown" && email !== "No Email") {
                try {
                    const customers = await stripe.customers.list({ email: email, limit: 1 });
                    if (customers.data.length > 0) {
                        stripeCustomerByEmail = customers.data[0].id;
                        // Check subs for this customer
                        const subs = await stripe.subscriptions.list({ customer: customers.data[0].id });

                        const activeOrTrialingSub = subs.data.find(sub => {
                            const isStatusValid = sub.status === 'active' || sub.status === 'trialing';
                            const hasPremiumPrice = sub.items.data.some((item: any) => item.price.id === premiumPriceId);
                            return isStatusValid && hasPremiumPrice;
                        });

                        if (activeOrTrialingSub) {
                            status = "VALID PREMIUM FOUND (By Email Recovery)";
                        } else {
                            status = "Customer Found By Email, But No Premium";
                        }
                    }
                } catch (e: any) {
                    status += " | Email Search Error: " + e.message;
                }
            }

            report.push({
                user_id: profile.id,
                email: email,
                db_plan: profile.subscription_plan,
                db_premium_end_at: profile.premium_end_at, // ADDED THIS
                db_trial_end_at: profile.premium_trial_end_at, // ADDED THIS
                stripe_customer_id: profile.stripe_customer_id,
                recovered_stripe_id: stripeCustomerByEmail,
                diagnosis: status,
            });
        }

        return NextResponse.json({ report }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
