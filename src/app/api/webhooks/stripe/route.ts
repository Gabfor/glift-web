
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

                const { data: { users }, error } = await supabase.auth.admin.listUsers();
                if (error) throw error;

                let user = users.find(u => u.app_metadata?.stripe_customer_id === customerId);

                if (!user) {
                    try {
                        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
                        if (customer.email && !customer.deleted) {
                            const emailWithFallback = customer.email;
                            user = users.find(u => u.email?.toLowerCase() === emailWithFallback.toLowerCase());
                            if (user) {
                                // Self-repair: Update metadata so next time it's faster
                                await supabase.auth.admin.updateUserById(user.id, {
                                    app_metadata: { stripe_customer_id: customerId }
                                });
                            }
                        }
                    } catch (e) {
                        console.error("Webhook: Failed to retrieve customer for lookup (invoice)", e);
                    }
                }

                if (user) {
                    const periodEnd = new Date(invoice.lines.data[0].period.end * 1000).toISOString();

                    await supabase.from("user_subscriptions").update({
                        end_date: periodEnd,
                        updated_at: new Date().toISOString(),
                    }).eq("user_id", user.id);

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

                const existingSubs = await stripe.subscriptions.list({
                    customer: customerId,
                    status: 'all',
                });
                const hasActive = existingSubs.data.some(sub => ['active', 'trialing', 'past_due'].includes(sub.status) && sub.id !== subscription.id);

                if (hasActive) {
                    console.log(`Webhook: Customer ${customerId} has other active subscriptions. Skipping.`);
                    break;
                }

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
            case "customer.subscription.updated": {
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = typeof subscription.customer === 'string'
                    ? subscription.customer
                    : (subscription.customer as Stripe.Customer | Stripe.DeletedCustomer)?.id;

                if (!customerId) return new NextResponse("No customer ID", { status: 400 });

                const { data: { users }, error } = await supabase.auth.admin.listUsers();
                if (error) throw error;

                let user = users.find(u => u.app_metadata?.stripe_customer_id === customerId);

                if (!user) {
                    try {
                        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
                        if (customer.email && !customer.deleted) {
                            const emailWithFallback = customer.email;
                            user = users.find(u => u.email?.toLowerCase() === emailWithFallback.toLowerCase());
                        }
                    } catch (e) {
                        console.error("Webhook: Failed to retrieve customer for lookup", e);
                    }
                }

                if (user) {
                    console.log(`Webhook: subscription.updated for user ${user.id} (${subscription.status})`);

                    const subAny = subscription as any;
                    const periodEnd = subAny.current_period_end
                        ? new Date(subAny.current_period_end * 1000).toISOString()
                        : null;
                    const trialEnd = subAny.trial_end
                        ? new Date(subAny.trial_end * 1000).toISOString()
                        : null;

                    const priceId = subAny.items?.data[0]?.price.id;
                    const isStarter = priceId === process.env.STRIPE_PRICE_ID_STARTER;

                    const updateData: any = {
                        updated_at: new Date().toISOString(),
                    };

                    if (periodEnd) {
                        updateData.premium_end_at = periodEnd;
                    }

                    if (isStarter) {
                        updateData.subscription_plan = 'starter';
                        updateData.premium_end_at = null;
                        updateData.premium_trial_end_at = null;
                        updateData.trial = false;
                    } else {
                        updateData.subscription_plan = 'premium';
                        updateData.trial = subscription.status === 'trialing';
                        updateData.premium_trial_end_at = trialEnd;
                        updateData.cancellation = subscription.cancel_at_period_end;
                    }

                    await supabase.from("profiles").update(updateData).eq("id", user.id);
                    console.log(`Webhook: Updated profile for ${user.id} with end_at=${periodEnd}`);
                } else {
                    console.warn(`Webhook: User not found for subscription.updated (Customer: ${customerId})`);
                }
                break;
            }
            case "invoice.payment_failed": {
                const invoice = event.data.object as any;
                const customerId = typeof invoice.customer === 'string'
                    ? invoice.customer
                    : invoice.customer?.id;

                console.error(`Webhook: Payment failed for customer ${customerId}, invoice ${invoice.id}`);
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

                                await stripe.subscriptions.update(subscriptionId, {
                                    cancel_at_period_end: false,
                                });

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
