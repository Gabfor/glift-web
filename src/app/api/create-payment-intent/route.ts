import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Utilisation de la clé secrète depuis les variables d'environnement
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    typescript: true,
});

export async function POST(request: Request) {
    try {
        const { email, userId } = await request.json();

        if (!userId || !email) {
            return NextResponse.json({ error: "Missing userId or email" }, { status: 400 });
        }

        // Initialize Supabase Admin client to access/update user metadata
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });

        // 1. Check if user already has a Stripe ID in Supabase Profiles (or matches by email)
        // We check 'profiles' table first (assuming 'stripe_customer_id' is there based on previous context, 
        // or we check auth.users metadata if profiles doesn't have it. 
        // Based on PaymentService, it seems we use app_metadata or profiles. Let's check profiles first.)

        // Actually, let's use the PaymentService approach: check app_metadata? 
        // But app_metadata requires Admin API on auth.users. 
        // Let's stick to 'stripe_customer_id' in 'profiles' if it exists, otherwise check Stripe.

        // Wait, typical setup: 
        // Check `id` -> `stripe_customer_id` in DB.

        // Let's first try to get the user from Supabase to see existing metadata
        const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId);

        let customerId = user?.user?.app_metadata?.stripe_customer_id;

        if (!customerId) {
            // Check Stripe by email
            const customers = await stripe.customers.list({
                email,
                limit: 1,
            });

            if (customers.data.length > 0) {
                customerId = customers.data[0].id;
            } else {
                // Create new customer
                const customer = await stripe.customers.create({
                    email,
                    metadata: {
                        user_id: userId,
                    },
                }, {
                    idempotencyKey: `create_customer_${userId}`,
                });
                customerId = customer.id;
            }

            // CRITICAL: Save this ID to Supabase immediately to prevent future duplicates
            await supabase.auth.admin.updateUserById(userId, {
                app_metadata: {
                    stripe_customer_id: customerId,
                },
            });
        }

        // Use the found/created ID
        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;

        // If retrieve failed or deleted
        if (customer.deleted) {
            throw new Error("Customer deleted in Stripe");
        }

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
