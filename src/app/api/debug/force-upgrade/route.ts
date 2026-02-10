import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { PaymentService } from '@/lib/services/paymentService';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const userId = "136e5f62-088e-48c8-abdf-ff3922c01910"; // The user from debug report who had 'No Customer ID' but was fixed? 
        // Wait, let's check the debug report again. 
        // User 1: b260bbd5... (email test@glift.fr) -> RECOVERED
        // User 2: 136e5f62... (fort.gaby@gmail.com) -> No Customer ID (but plan is premium??)

        // I should probably allow passing ID in query or try both.
        // Let's default to the 'test@glift.fr' one first as that seems to be the active testing account.

        const targetUserId = "3fb1bc66-9ddc-4c1c-8c2f-97bcd5bb9e66";

        const adminSupabase = createAdminClient();

        // 1. Fetch real email
        const { data: userData, error: userError } = await adminSupabase.auth.admin.getUserById(targetUserId);
        const realEmail = userData.user?.email || "gabriel@glift.com";
        const customerId = userData.user?.user_metadata?.stripe_customer_id || "cus_TxI0iJjD8qbtiv";

        console.log(`Force Upgrade: Real email for ${targetUserId} is ${realEmail}, Customer: ${customerId}`);

        // 2. Fetch Stripe Sub directly
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: 'all', // Fetch ALL including cancelled or trialing
            limit: 1,
        });

        let stripeSub = null;
        let periodEnd = null;

        if (subscriptions.data.length > 0) {
            stripeSub = subscriptions.data[0];
            console.log(`Force Upgrade: Found sub ${stripeSub.id}, status=${stripeSub.status}`);

            // Force end trial if it's trialing or stuck
            if (stripeSub.status === 'trialing' || stripeSub.status === 'active') { // Active check just in case
                console.log(`Force Upgrade: Ending trial for ${stripeSub.id} NOW to force charge/date update.`);
                const updatedStripeSub = await stripe.subscriptions.update(stripeSub.id, {
                    trial_end: 'now',
                });

                stripeSub = updatedStripeSub;
                console.log(`Force Upgrade: Updated sub status=${stripeSub.status}, current_period_end=${stripeSub.current_period_end}`);
            }

            if (stripeSub.current_period_end) {
                try {
                    periodEnd = new Date(stripeSub.current_period_end * 1000).toISOString();
                } catch (e) {
                    console.error("Invalid date from Stripe:", stripeSub.current_period_end);
                }
            } else if (stripeSub.status === 'active') {
                // Fallback: If active but no date returned (API weirdness), assume 1 month
                console.log("Force Upgrade: Status is active but date missing. defaulting to +32 days.");
                const now = new Date();
                now.setDate(now.getDate() + 32);
                periodEnd = now.toISOString();
            }
        }

        // 3. Force DB Update if valid date found
        let dbUpdate = null;
        if (periodEnd) {
            const updateData = {
                subscription_plan: 'premium',
                premium_end_at: periodEnd,
                cancellation: false,
                trial: false, // Explicitly turn off trial flag in DB
                premium_trial_end_at: null // Clear trial end date
            };

            dbUpdate = await adminSupabase.from('profiles').update(updateData).eq('id', targetUserId).select();
        }

        return NextResponse.json({
            user: { id: targetUserId, email: realEmail, customerId },
            stripeSub: stripeSub ? { id: stripeSub.id, status: stripeSub.status, current_period_end: stripeSub.current_period_end, periodEndIso: periodEnd } : null,
            dbUpdate: dbUpdate
        });

    } catch (err: any) {
        return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 });
    }
}
