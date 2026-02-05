import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    typescript: true,
});

export async function GET(request: Request) {
    try {
        const supabase = await createClient();

        // 1. Verify Authentication
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Get User's Stripe Customer ID
        let stripeCustomerId = user.app_metadata?.stripe_customer_id;
        console.log("Stripe Customer ID:", stripeCustomerId);

        if (!stripeCustomerId && user.email) {
            console.log("Looking up Stripe Customer by email:", user.email);
            const customers = await stripe.customers.list({
                email: user.email,
                limit: 1,
            });
            if (customers.data.length > 0) {
                stripeCustomerId = customers.data[0].id;
                console.log("Found Stripe Customer ID via email:", stripeCustomerId);
            }
        }

        if (!stripeCustomerId) {
            console.log("No Stripe Customer ID found in app_metadata or by email");
            return NextResponse.json({ data: [] });
        }

        // 3. List Payment Methods from Stripe
        let paymentMethodsData: Stripe.PaymentMethod[] = [];

        const paymentMethods = await stripe.paymentMethods.list({
            customer: stripeCustomerId,
            type: 'card',
        });
        paymentMethodsData = paymentMethods.data;
        console.log("Payment Methods from list:", paymentMethodsData.length);

        // FALLBACK: If no payment methods found, check the active subscription's default_payment_method
        if (paymentMethodsData.length === 0) {
            console.log("Checking subscriptions for default payment method...");
            const subscriptions = await stripe.subscriptions.list({
                customer: stripeCustomerId,
                status: 'all', // Check all including trialing
                limit: 1,
            });

            if (subscriptions.data.length > 0) {
                const sub = subscriptions.data[0];
                const defaultPmId = typeof sub.default_payment_method === 'string'
                    ? sub.default_payment_method
                    : sub.default_payment_method?.id;

                console.log("Subscription:", sub.id, "Default PM:", defaultPmId);

                if (defaultPmId) {
                    try {
                        const pm = await stripe.paymentMethods.retrieve(defaultPmId);
                        if (pm && pm.card) {
                            paymentMethodsData = [pm];
                            // Optional: Attach it to customer to fix future lists
                            // await stripe.paymentMethods.attach(pm.id, { customer: stripeCustomerId });
                        }
                    } catch (e) {
                        console.error("Failed to retrieve subscription default PM", e);
                    }
                }
            }
        }

        // 4. Return relevant details
        const formattedMethods = paymentMethodsData.map(pm => ({
            id: pm.id,
            brand: pm.card?.brand,
            last4: pm.card?.last4,
            exp_month: pm.card?.exp_month,
            exp_year: pm.card?.exp_year,
        }));

        return NextResponse.json({ data: formattedMethods });

    } catch (error: any) {
        console.error("Error fetching payment methods:", error);
        return NextResponse.json(
            { error: `Internal Server Error: ${error.message}` },
            { status: 500 }
        );
    }
}
