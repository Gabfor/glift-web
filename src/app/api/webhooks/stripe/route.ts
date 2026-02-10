
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    typescript: true,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get("Stripe-Signature") as string;

    let event: Stripe.Event;

    try {
        if (!webhookSecret) return new NextResponse("Missing webhook secret", { status: 500 });
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
        return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
    }

    const supabase = createAdminClient();

    try {
        switch (event.type) {
            case "invoice.payment_succeeded": {
                const invoice = event.data.object as any;
                const subscriptionId = typeof invoice.subscription === 'string'
                    ? invoice.subscription
                    : invoice.subscription?.id;

                const customerId = typeof invoice.customer === 'string'
                    ? invoice.customer
                    : invoice.customer?.id;

                // Find user by stripe_customer_id in metadata
                // Note: querying by metadata is slow/complex in standard auth, simpler if we stored it in profiles.
                // For now, let's assume we can query user_subscriptions if we add stripe_subscription_id there, OR query users
                // Since we put it in app_metadata, we have to search users.

                const { data: { users }, error } = await supabase.auth.admin.listUsers();
                if (error) throw error;

                const user = users.find(u => u.app_metadata?.stripe_customer_id === customerId);

                if (user) {
                    // Extend subscription
                    // invoice.lines.data[0].period.end
                    const periodEnd = new Date(invoice.lines.data[0].period.end * 1000).toISOString();

                    await supabase.from("user_subscriptions").update({
                        end_date: periodEnd,
                        updated_at: new Date().toISOString(),
                    }).eq("user_id", user.id);

                    // Also update profiles to mark trial as used (since they paid/invoiced)
                    // and ensure subscription_plan is premium if it's a paid invoice
                    // (Though usually subscription update handles plan, this is a safety net)
                    await supabase.from("profiles").update({
                        trial: true,
                        updated_at: new Date().toISOString(),
                    }).eq("id", user.id);
                }
                break;
            }
            case "customer.subscription.deleted": {
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = typeof subscription.customer === 'string'
                    ? subscription.customer
                    : (subscription.customer as Stripe.Customer | Stripe.DeletedCustomer)?.id;

                if (!customerId) return new NextResponse("No customer ID", { status: 400 });

                // 1. Check if customer is deleted
                try {
                    const customer = await stripe.customers.retrieve(customerId);
                    if (customer.deleted) {
                        console.log(`Webhook: Customer ${customerId} deleted. Skipping Starter re-creation.`);
                        break;
                    }
                } catch (e) {
                    console.error("Webhook: Error retrieving customer", e);
                    break;
                }

                // 2. Check if user already has another active subscription
                const existingSubs = await stripe.subscriptions.list({
                    customer: customerId,
                    status: 'all', // listing all to filter active
                });
                const hasActive = existingSubs.data.some(sub => ['active', 'trialing', 'past_due'].includes(sub.status) && sub.id !== subscription.id);

                if (hasActive) {
                    console.log(`Webhook: Customer ${customerId} has other active subscriptions. Skipping.`);
                    break;
                }

                // 3. Create Starter Subscription
                const starterPrice = process.env.STRIPE_PRICE_ID_STARTER;
                if (!starterPrice) {
                    console.error("Webhook: STRIPE_PRICE_ID_STARTER missing");
                    break;
                }

                console.log(`Webhook: Re-creating Starter subscription for customer ${customerId}`);
                const newSub = await stripe.subscriptions.create({
                    customer: customerId,
                    items: [{ price: starterPrice }],
                });

                // 4. Find User and Update
                const { data: { users }, error } = await supabase.auth.admin.listUsers();
                if (error || !users) {
                    console.error("Webhook: Error listing users", error);
                    break;
                }

                let user = users.find(u => u.app_metadata?.stripe_customer_id === customerId);

                // Fallback: Find by email if metadata lookup fails
                if (!user) {
                    try {
                        console.log(`Webhook: User not found by ID for customer ${customerId}. Trying email lookup...`);
                        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
                        if (customer.email && !customer.deleted) {
                            const customerEmail = customer.email;
                            user = users.find(u => u.email?.toLowerCase() === customerEmail.toLowerCase());
                            if (user) {
                                console.log(`Webhook: Found user ${user.id} by email ${customerEmail}`);
                                // Optional: Repair metadata?
                            }
                        }
                    } catch (err) {
                        console.error("Webhook: Error retrieving customer for email lookup", err);
                    }
                }

                if (user) {
                    // Update metadata
                    await supabase.auth.admin.updateUserById(user.id, {
                        app_metadata: {
                            stripe_customer_id: customerId, // Ensure it's set
                            stripe_subscription_id: newSub.id
                        }
                    });

                    // Update profiles table
                    await supabase.from("profiles").update({
                        subscription_plan: 'starter',
                        cancellation: false,
                        premium_end_at: null,
                        premium_trial_end_at: null, // Clear trial end too as they are now on Starter
                        updated_at: new Date().toISOString(),
                    } as any).eq("id", user.id);

                    // Update user_subscriptions (legacy/internal tracking)
                    await supabase.from("user_subscriptions").update({
                        plan: 'starter',
                        end_date: null,
                        updated_at: new Date().toISOString(),
                    }).eq("user_id", user.id);
                } else {
                    console.warn(`Webhook: User not found for customer ${customerId} (even after email fallback)`);
                }
                break;
            }
            case "setup_intent.succeeded": {
                const setupIntent = event.data.object as Stripe.SetupIntent;
                const subscriptionId = setupIntent.metadata?.subscription_id;

                if (subscriptionId) {
                    console.log(`Webhook: SetupIntent succeeded for subscription ${subscriptionId}. Checking if reactivation needed.`);

                    try {
                        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

                        if (subscription && subscription.cancel_at_period_end) {
                            const customerId = typeof subscription.customer === 'string'
                                ? subscription.customer
                                : (subscription.customer as Stripe.Customer | Stripe.DeletedCustomer)?.id;

                            const { data: { users }, error } = await supabase.auth.admin.listUsers();
                            if (error) throw error;

                            const user = users.find(u => u.app_metadata?.stripe_customer_id === customerId);

                            if (user) {
                                console.log(`Webhook: Reactivating subscription ${subscriptionId} for user ${user.id}`);

                                // Reactivate in Stripe
                                await stripe.subscriptions.update(subscriptionId, {
                                    cancel_at_period_end: false,
                                });

                                // Update Supabase
                                await supabase.from('profiles').update({
                                    cancellation: false,
                                    premium_end_at: null
                                } as any).eq('id', user.id);
                            }
                        }
                    } catch (e) {
                        console.error(`Webhook: Error processing setup_intent.succeeded for subscription ${subscriptionId}`, e);
                    }
                }
                break;
            }
        }
    } catch (error: any) {
        console.error(`Error processing webhook: ${error.message}`);
        return new NextResponse("Webhook handler failed", { status: 500 });
    }

    return NextResponse.json({ received: true });
}
