import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { ensureAdmin } from "@/app/api/admin/users/utils";

// Force dynamic to avoid caching
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const adminCheck = await ensureAdmin();
        if (adminCheck.status !== 200) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        // Init Stripe
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
            typescript: true,
        });

        // Init Supabase Admin
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

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

            // Get App Metadata (where we save stripe_customer_id)
            const customerId = userData.user?.app_metadata?.stripe_customer_id;

            if (customerId) {
                try {
                    const subscriptions = await stripe.subscriptions.list({
                        customer: customerId,
                        status: "all",
                        expand: ["data.default_payment_method"],
                    });

                    stripeData = subscriptions.data.map((sub: any) => ({
                        id: sub.id,
                        status: sub.status,
                        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
                        cancel_at_period_end: sub.cancel_at_period_end,
                        plan_id: sub.items.data[0]?.price.id,
                        is_premium_price: sub.items.data[0]?.price.id === premiumPriceId,
                    }));

                    status = stripeData.length > 0 ? "Has Subscriptions" : "Customer Exists, No Subs";
                } catch (e: any) {
                    stripeData = `Error fetching Stripe: ${e.message}`;
                    status = "Stripe Error";
                }
            } else if (email !== "Unknown" && email !== "No Email") {
                try {
                    const customers = await stripe.customers.list({
                        email: email,
                        limit: 1
                    });
                    if (customers.data.length > 0) {
                        stripeCustomerByEmail = customers.data[0].id;
                    }
                } catch (e) {
                    // Ignore
                }
            }

            report.push({
                user_id: profile.id,
                email: email,
                db_plan: profile.subscription_plan,
                db_premium_end: profile.premium_end_at,
                stripe_customer_id: customerId || "None",
                stripe_customer_by_email_lookup: stripeCustomerByEmail,
                status: status,
                stripe_subscriptions: stripeData,
            });
        }

        return NextResponse.json({
            count: report.length,
            target_premium_price_id: premiumPriceId,
            report: report,
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 });
    }
}
