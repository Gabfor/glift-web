
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/lib/supabase/types";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    typescript: true,
});

export class WebhookService {
    constructor(private supabase: SupabaseClient<Database>) { }

    async handleEvent(event: Stripe.Event) {
        switch (event.type) {
            case "invoice.payment_succeeded":
                await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
                break;
            case "customer.subscription.deleted":
                await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
                break;
            case "customer.subscription.updated":
                await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
                break;
            case "invoice.payment_failed":
                await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
                break;
            case "setup_intent.succeeded":
                await this.handleSetupIntentSucceeded(event.data.object as Stripe.SetupIntent);
                break;
        }
    }

    private async handlePaymentSucceeded(invoice: Stripe.Invoice) {
        const invoiceAny = invoice as any;
        const subscriptionId = typeof invoiceAny.subscription === 'string'
            ? invoiceAny.subscription
            : invoiceAny.subscription?.id;

        const customerId = typeof invoiceAny.customer === 'string'
            ? invoiceAny.customer
            : invoiceAny.customer?.id;

        if (!customerId) return;

        const { data: { users }, error } = await this.supabase.auth.admin.listUsers();
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
                        await this.supabase.auth.admin.updateUserById(user.id, {
                            app_metadata: { stripe_customer_id: customerId }
                        });
                    }
                }
            } catch (e) {
                console.error("Webhook: Failed to retrieve customer for lookup (invoice)", e);
            }
        }

        if (user && invoice.lines.data[0]?.period?.end) {
            const periodEnd = new Date(invoice.lines.data[0].period.end * 1000).toISOString();
            const priceId = invoice.lines.data[0]?.price?.id;
            const isStarter = priceId === process.env.STRIPE_PRICE_ID_STARTER;

            await this.supabase.from("user_subscriptions").update({
                plan: isStarter ? 'starter' : 'premium',
                end_date: periodEnd,
                updated_at: new Date().toISOString(),
            }).eq("user_id", user.id);

            await this.supabase.from("profiles").update({
                subscription_plan: isStarter ? 'starter' : 'premium',
                // If payment succeeded, it's not a trial (unless it's a $0 trial invoice? But usually that's different).
                // Assuming payment_succeeded means they paid, so trial is false.
                trial: false,
                premium_end_at: isStarter ? null : periodEnd,
                updated_at: new Date().toISOString(),
            }).eq("id", user.id);
        }
    }

    private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
        const customerId = typeof subscription.customer === 'string'
            ? subscription.customer
            : (subscription.customer as Stripe.Customer | Stripe.DeletedCustomer)?.id;

        if (!customerId) return;

        try {
            const customer = await stripe.customers.retrieve(customerId);
            if (customer.deleted) {
                console.log(`Webhook: Customer ${customerId} deleted. Skipping Starter re-creation.`);
                return;
            }
        } catch (e) {
            console.error("Webhook: Error retrieving customer", e);
            return;
        }

        const existingSubs = await stripe.subscriptions.list({
            customer: customerId,
            status: 'all',
        });
        const hasActive = existingSubs.data.some(sub => ['active', 'trialing', 'past_due'].includes(sub.status) && sub.id !== subscription.id);

        if (hasActive) {
            console.log(`Webhook: Customer ${customerId} has other active subscriptions. Skipping.`);
            return;
        }

        const starterPrice = process.env.STRIPE_PRICE_ID_STARTER;
        if (!starterPrice) {
            console.error("Webhook: STRIPE_PRICE_ID_STARTER missing");
            return;
        }

        console.log(`Webhook: Re-creating Starter subscription for customer ${customerId}`);
        const newSub = await stripe.subscriptions.create({
            customer: customerId,
            items: [{ price: starterPrice }],
        });

        const { data: { users }, error } = await this.supabase.auth.admin.listUsers();
        if (error || !users) {
            console.error("Webhook: Error listing users", error);
            return;
        }

        let user = users.find(u => u.app_metadata?.stripe_customer_id === customerId);

        // Fallback: Find by email if metadata lookup fails
        if (!user) {
            try {
                console.log(`Webhook: User not found by ID for customer ${customerId}. Trying email lookup...`);
                // Re-fetch customer might be redundant as we fetched it above, but safe.
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
            await this.supabase.auth.admin.updateUserById(user.id, {
                app_metadata: {
                    stripe_customer_id: customerId,
                    stripe_subscription_id: newSub.id
                }
            });

            // Update profiles table
            await this.supabase.from("profiles").update({
                subscription_plan: 'starter',
                cancellation: false,
                premium_end_at: null,
                premium_trial_end_at: null,
                updated_at: new Date().toISOString(),
            } as any).eq("id", user.id);

            // Update user_subscriptions (legacy/internal tracking)
            await this.supabase.from("user_subscriptions").update({
                plan: 'starter',
                end_date: null,
                updated_at: new Date().toISOString(),
            }).eq("user_id", user.id);
        } else {
            console.warn(`Webhook: User not found for customer ${customerId} (even after email fallback)`);
        }
    }

    private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
        const customerId = typeof subscription.customer === 'string'
            ? subscription.customer
            : (subscription.customer as Stripe.Customer | Stripe.DeletedCustomer)?.id;

        if (!customerId) return;

        const { data: { users }, error } = await this.supabase.auth.admin.listUsers();
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

            await this.supabase.from("profiles").update(updateData).eq("id", user.id);
            console.log(`Webhook: Updated profile for ${user.id} with end_at=${periodEnd}`);
        } else {
            console.warn(`Webhook: User not found for subscription.updated (Customer: ${customerId})`);
        }
    }

    private async handlePaymentFailed(invoice: Stripe.Invoice) {
        const customerId = typeof invoice.customer === 'string'
            ? invoice.customer
            : invoice.customer?.id;

        console.error(`Webhook: Payment failed for customer ${customerId}, invoice ${invoice.id}`);
    }

    private async handleSetupIntentSucceeded(setupIntent: Stripe.SetupIntent) {
        const subscriptionId = setupIntent.metadata?.subscription_id;

        if (subscriptionId) {
            console.log(`Webhook: SetupIntent succeeded for subscription ${subscriptionId}. Checking if reactivation needed.`);

            try {
                const subscription = await stripe.subscriptions.retrieve(subscriptionId);

                if (subscription && subscription.cancel_at_period_end) {
                    const customerId = typeof subscription.customer === 'string'
                        ? subscription.customer
                        : (subscription.customer as Stripe.Customer | Stripe.DeletedCustomer)?.id;

                    const { data: { users }, error } = await this.supabase.auth.admin.listUsers();
                    if (error) throw error;

                    const user = users.find(u => u.app_metadata?.stripe_customer_id === customerId);

                    if (user) {
                        console.log(`Webhook: Reactivating subscription ${subscriptionId} for user ${user.id}`);

                        await stripe.subscriptions.update(subscriptionId, {
                            cancel_at_period_end: false,
                        });

                        await this.supabase.from('profiles').update({
                            cancellation: false,
                            premium_end_at: null
                        } as any).eq('id', user.id);
                    }
                }
            } catch (e) {
                console.error(`Webhook: Error processing setup_intent.succeeded for subscription ${subscriptionId}`, e);
            }
        }
    }
}
