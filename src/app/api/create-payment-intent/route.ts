import { NextResponse } from "next/server";
import Stripe from "stripe";

// Utilisation de la clé secrète depuis les variables d'environnement
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    typescript: true,
});

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        // 1. Create a customer
        const customer = await stripe.customers.create({
            email,
        });

        const priceId = process.env.STRIPE_PRICE_ID_PREMIUM;

        if (!priceId) {
            throw new Error("STRIPE_PRICE_ID_PREMIUM is not defined in environment variables");
        }

        // 2. Create a subscription with trial
        const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [{
                price: priceId,
            }],
            trial_period_days: 30,
            payment_behavior: 'default_incomplete',
            payment_settings: { save_default_payment_method: 'on_subscription' },
            expand: ['latest_invoice.payment_intent', 'pending_setup_intent'],
        });

        // 3. Extract client secret
        // Depending on payment_behavior, it might be in pending_setup_intent or latest_invoice
        // For 'default_incomplete' with trial, it's usually in pending_setup_intent for card setup
        const setupIntent = subscription.pending_setup_intent as Stripe.SetupIntent;
        const clientSecret = setupIntent?.client_secret;

        if (!clientSecret) {
            throw new Error("Failed to generate client secret for subscription setup");
        }

        return NextResponse.json({
            clientSecret: clientSecret,
            subscriptionId: subscription.id,
            customerId: customer.id,
        });
    } catch (error: any) {
        console.error("Internal Error:", error);
        return NextResponse.json(
            { error: `Internal Server Error: ${error.message}` },
            { status: 500 }
        );
    }
}
