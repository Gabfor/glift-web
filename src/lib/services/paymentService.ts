import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/lib/supabase/types";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    typescript: true,
});

export interface PaymentMethod {
    id: string;
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
}

export class PaymentService {
    constructor(private supabase: SupabaseClient<Database>) { }

    async getUserPaymentMethods(userId: string, userEmail?: string, appMetadata?: any): Promise<PaymentMethod[]> {
        // 1. Get User's Stripe Customer ID
        let stripeCustomerId = appMetadata?.stripe_customer_id;

        // If not in metadata, try to find by email
        if (!stripeCustomerId && userEmail) {
            console.log("PaymentService: Looking up Stripe Customer by email:", userEmail);
            const customers = await stripe.customers.list({
                email: userEmail,
                limit: 1,
            });
            if (customers.data.length > 0) {
                stripeCustomerId = customers.data[0].id;
                console.log("PaymentService: Found Stripe Customer ID via email:", stripeCustomerId);
            }
        }

        if (!stripeCustomerId) {
            console.log("PaymentService: No Stripe Customer ID found");
            return [];
        }

        // 2. List Payment Methods from Stripe
        let paymentMethodsData: Stripe.PaymentMethod[] = [];

        const paymentMethods = await stripe.paymentMethods.list({
            customer: stripeCustomerId,
            type: 'card',
        });
        paymentMethodsData = paymentMethods.data;


        // FALLBACK: If no payment methods found, check the active subscription's default_payment_method
        if (paymentMethodsData.length === 0) {
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

                if (defaultPmId) {
                    try {
                        const pm = await stripe.paymentMethods.retrieve(defaultPmId);
                        if (pm && pm.card) {
                            paymentMethodsData = [pm];
                        }
                    } catch (e) {
                        console.error("PaymentService: Failed to retrieve subscription default PM", e);
                    }
                }
            }
        }

        // 3. Return relevant details
        return paymentMethodsData.map((pm: any) => ({
            id: pm.id,
            brand: pm.card?.brand || 'unknown',
            last4: pm.card?.last4 || '????',
            exp_month: pm.card?.exp_month || 0,
            exp_year: pm.card?.exp_year || 0,
        }));
    }

    async createSubscriptionSetup(userEmail: string, userId: string, appMetadata: any) {
        // 1. Get or Create Customer
        let customerId = appMetadata?.stripe_customer_id;

        if (!customerId) {
            // Check by email
            const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
            if (customers.data.length > 0) {
                customerId = customers.data[0].id;
            } else {
                // Create new
                const customer = await stripe.customers.create({
                    email: userEmail,
                    metadata: { user_id: userId }
                });
                customerId = customer.id;
            }
            // TODO: Ideally update app_metadata here via Supabase Admin, but for now we rely on the webhook or next sync
        }

        const priceId = process.env.STRIPE_PRICE_ID_PREMIUM;
        if (!priceId) throw new Error("STRIPE_PRICE_ID_PREMIUM missing");

        // 2. Check for existing active subscription
        const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: 'all',
            limit: 1,
        });

        // If has active/trialing subscription, creates a SetupIntent to update payment method
        const activeSub = subscriptions.data.find(sub => ['active', 'trialing', 'past_due'].includes(sub.status));

        if (activeSub) {
            // Create a SetupIntent for this customer
            const setupIntent = await stripe.setupIntents.create({
                customer: customerId,
                payment_method_types: ['card'],
                metadata: { subscription_id: activeSub.id }
            });

            return {
                clientSecret: setupIntent.client_secret,
                customerId,
                subscriptionId: activeSub.id,
                plan: 'premium'
            };
        }

        // Fetch user profile to check trial eligibility
        const { data: profile } = await this.supabase
            .from('profiles')
            .select('trial')
            .eq('id', userId)
            .single();

        const hasUsedTrial = profile?.trial ?? false;
        const trialDays = hasUsedTrial ? 0 : 30;

        // 3. Create new subscription if none exists
        const subscriptionParams: any = {
            customer: customerId,
            items: [{ price: priceId }],
            payment_behavior: 'default_incomplete',
            payment_settings: { save_default_payment_method: 'on_subscription' },
            expand: ['pending_setup_intent'],
        };

        if (trialDays > 0) {
            subscriptionParams.trial_period_days = trialDays;
        }

        const subscription = await stripe.subscriptions.create(subscriptionParams);

        const setupIntent = subscription.pending_setup_intent as Stripe.SetupIntent;

        // If we gave a trial, mark it as used
        if (trialDays > 0) {
            await this.supabase.from('profiles').update({ trial: true } as any).eq('id', userId);
        }

        return {
            clientSecret: setupIntent.client_secret,
            customerId,
            subscriptionId: subscription.id,
            plan: 'premium'
        };
    }

    async updateSubscription(userEmail: string, userId: string, appMetadata: any, newPlan: 'premium' | 'starter') {
        let customerId = appMetadata?.stripe_customer_id;

        if (!customerId) {
            // Try fetch by email
            const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
            if (customers.data.length > 0) {
                customerId = customers.data[0].id;
            } else {
                throw new Error("No customer found");
            }
        }

        const priceId = process.env.STRIPE_PRICE_ID_PREMIUM;
        if (!priceId) throw new Error("STRIPE_PRICE_ID_PREMIUM missing");

        const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: 'all',
            limit: 1,
        });

        const activeSub = subscriptions.data.find(sub => ['active', 'trialing', 'past_due'].includes(sub.status));

        if (newPlan === 'premium') {
            if (activeSub) {
                // Check if already premium (price check)
                const currentPriceId = activeSub.items.data[0]?.price.id;
                if (currentPriceId === priceId) {
                    // Update profiles to ensure sync even if webhook failed
                    const trialEnd = activeSub.trial_end ? new Date(activeSub.trial_end * 1000).toISOString() : null;
                    await this.supabase.from('profiles').update({
                        cancellation: activeSub.cancel_at_period_end,
                        premium_trial_end_at: trialEnd,
                        subscription_plan: 'premium'
                    } as any).eq('id', userId);

                    return { status: 'already_premium', subscriptionId: activeSub.id };
                }

                // Upgrade/Update to Premium from another plan (rare case if only 2 plans)
                // But if they are re-subscribing on an existing cancelled-but-active sub?
                // Simplification for now: update the item.

                const updatedSub = await stripe.subscriptions.update(activeSub.id, {
                    items: [{
                        id: activeSub.items.data[0].id,
                        price: priceId,
                    }],
                    cancel_at_period_end: false,
                });

                // Update profiles.cancellation = false AND set trial end if applicable
                const trialEnd = updatedSub.trial_end ? new Date(updatedSub.trial_end * 1000).toISOString() : null;
                await this.supabase.from('profiles').update({
                    cancellation: false,
                    premium_trial_end_at: trialEnd,
                    // We don't mark trial=true here typically because upgrade implies they already had a sub?
                    // Or if they were on basic? Basic is usually no sub in this system.
                    // If they upgrade from a hypothetical paid-non-trial plan to another, trial logic might not apply.
                    // But in this app, "Starter" = no sub. So we only hit this block if they have a sub that is NOT premium price?
                    // If they have a sub, they probably already used trial or are paying.
                    // Let's assume upgrade doesn't grant new trial unless explicitly handled.
                } as any).eq('id', userId);

                return { status: 'updated', subscriptionId: updatedSub.id };
            } else {
                // No active subscription: Create new one

                // Fetch user profile to check trial eligibility
                const { data: profile } = await this.supabase
                    .from('profiles')
                    .select('trial')
                    .eq('id', userId)
                    .single();

                const hasUsedTrial = profile?.trial ?? false;
                const trialDays = hasUsedTrial ? 0 : 30;

                // Check if customer has a default payment method
                const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
                if (!customer.invoice_settings.default_payment_method) {
                    // Try to find a payment method to attach
                    const paymentMethods = await stripe.paymentMethods.list({ customer: customerId, type: 'card' });
                    if (paymentMethods.data.length > 0) {
                        // Attach first one as default
                        await stripe.customers.update(customerId, {
                            invoice_settings: { default_payment_method: paymentMethods.data[0].id }
                        });
                    } else {
                        throw new Error("No payment method available");
                    }
                }

                const subscriptionParams: any = {
                    customer: customerId,
                    items: [{ price: priceId }],
                    payment_behavior: 'error_if_incomplete',
                };

                if (trialDays > 0) {
                    subscriptionParams.trial_period_days = trialDays;
                }

                const subscription = await stripe.subscriptions.create(subscriptionParams);

                // If we gave a trial, mark it as used
                if (trialDays > 0) {
                    await this.supabase.from('profiles').update({ trial: true } as any).eq('id', userId);
                }

                // Update profiles.cancellation = false AND set trial_end
                const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null;
                await this.supabase.from('profiles').update({
                    cancellation: false,
                    premium_trial_end_at: trialEnd
                } as any).eq('id', userId);

                return { status: 'created', subscriptionId: subscription.id };
            }
        } else {
            // Downgrade to Starter (Cancel Premium)
            if (activeSub) {
                const endDate = (activeSub as any).current_period_end || Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);

                const updatedSub = await stripe.subscriptions.update(activeSub.id, {
                    cancel_at_period_end: true,
                });

                // Update profiles.cancellation = true
                await this.supabase.from('profiles').update({ cancellation: true } as any).eq('id', userId);

                return {
                    status: 'canceled_at_period_end',
                    subscriptionId: updatedSub.id,
                    currentPeriodEnd: endDate
                };
            }
            return { status: 'already_starter', subscriptionId: null };
        }
    }

    async getSubscriptionDetails(userId: string, userEmail: string, appMetadata: any) {
        let customerId = appMetadata?.stripe_customer_id;

        if (!customerId && userEmail) {
            const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
            if (customers.data.length > 0) customerId = customers.data[0].id;
        }

        if (!customerId) return null;

        const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: 'all',
            limit: 1,
        });

        const activeSub = subscriptions.data.find(sub => ['active', 'trialing', 'past_due'].includes(sub.status));

        if (activeSub) {
            return {
                id: activeSub.id,
                status: activeSub.status,
                cancel_at_period_end: activeSub.cancel_at_period_end,
                current_period_end: (activeSub as any).current_period_end,
                plan: activeSub.items.data[0]?.price.id === process.env.STRIPE_PRICE_ID_PREMIUM ? 'premium' : 'starter'
            };
        }
        return null;
    }

    async deleteCustomer(userId: string, userEmail: string, appMetadata: any) {
        let customerId = appMetadata?.stripe_customer_id;

        if (!customerId && userEmail) {
            console.log("PaymentService.deleteCustomer: Looking up Stripe Customer by email:", userEmail);
            const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
            if (customers.data.length > 0) {
                customerId = customers.data[0].id;
            }
        }

        if (customerId) {
            try {
                // Delete the customer in Stripe. This cancels subscriptions and removes payment methods.
                await stripe.customers.del(customerId);
                console.log(`PaymentService.deleteCustomer: Successfully deleted Stripe customer ${customerId}`);
            } catch (error) {
                console.error(`PaymentService.deleteCustomer: Failed to delete Stripe customer ${customerId}`, error);
                throw error;
            }
        } else {
            console.log("PaymentService.deleteCustomer: No Stripe customer found to delete.");
        }
    }
}
