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

        // Validate stale ID
        const resolvedId = await this.resolveStaleCustomerId(stripeCustomerId);
        stripeCustomerId = resolvedId;

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

    async createCustomerAndStarterSubscription(userId: string, email: string, name: string) {
        console.log(`PaymentService: createCustomerAndStarterSubscription called for user ${userId} (${email})`);

        // 1. Check if user already has a valid Stripe Customer ID in Supabase metadata
        // ... (existing logic) ...
        // Actually, let's create a new customer regardless of potentially stale ID, OR check if it exists.
        // For fresh signup, it should be new.
        const customer = await stripe.customers.create({
            email,
            name,
            metadata: { user_id: userId },
        });
        console.log(`PaymentService: Created new Stripe Customer: ${customer.id}`);

        const starterPriceId = process.env.STRIPE_PRICE_ID_STARTER;
        if (!starterPriceId) throw new Error("STRIPE_PRICE_ID_STARTER missing");

        // 2. Create Starter Subscription (Free)
        const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [{ price: starterPriceId }],
        });

        console.log(`PaymentService: Created Starter Subscription ${subscription.id} for customer ${customer.id}`);

        // 3. Update Supabase User Metadata with Stripe IDs
        await this.supabase.auth.admin.updateUserById(userId, {
            app_metadata: {
                stripe_customer_id: customer.id,
                stripe_subscription_id: subscription.id,
            }
        });
        console.log("PaymentService: Updated Supabase auth metadata");

        return { customerId: customer.id, subscriptionId: subscription.id };
    }

    async createSubscriptionSetup(userEmail: string, userId: string, appMetadata: any) {
        console.log(`PaymentService: createSubscriptionSetup called for user ${userId}`);

        // 1. Get or Create Customer
        let customerId = appMetadata?.stripe_customer_id;

        // Validation helper
        customerId = await this.resolveStaleCustomerId(customerId);
        console.log(`PaymentService.createSubscriptionSetup: ID from metadata/resolved: ${customerId}`);

        if (!customerId) {
            // Check by email
            console.log("PaymentService: Customer ID missing, checking by email...");
            const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
            if (customers.data.length > 0) {
                const foundCustomer = customers.data[0];
                if (!foundCustomer.deleted) {
                    customerId = foundCustomer.id;
                    console.log(`PaymentService: Found existing customer by email: ${customerId}`);
                } else {
                    console.log(`PaymentService: Customer found by email ${foundCustomer.id} is deleted. Creating new one.`);
                }
            }

            if (!customerId) {
                // Create new
                console.log("PaymentService: Creating NEW customer...");
                const customer = await stripe.customers.create({
                    email: userEmail,
                    metadata: { user_id: userId },
                }, {
                    idempotencyKey: `create_cust_${userId}_${Date.now()}` // Unique key for new creation
                });
                customerId = customer.id;
                console.log(`PaymentService: Created new customer ${customerId}`);

                // CRITICAL: Update Supabase immediately to fix the stale metadata for future calls
                await this.supabase.auth.admin.updateUserById(userId, {
                    app_metadata: {
                        stripe_customer_id: customerId,
                    }
                });
            }
        }

        const priceId = process.env.STRIPE_PRICE_ID_PREMIUM;
        console.log(`PaymentService.createSubscriptionSetup: Using Price ID: ${priceId}`);
        if (!priceId) throw new Error("STRIPE_PRICE_ID_PREMIUM missing");

        // 2. Check for existing active subscription
        const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: 'all',
            limit: 10, // Increased limit to see history if needed
        });

        console.log(`PaymentService.createSubscriptionSetup: Found ${subscriptions.data.length} total subscriptions for customer`);
        subscriptions.data.forEach(s => console.log(` - Sub ${s.id}: status=${s.status}, plan=${s.items.data[0]?.price.id}, cancel_at_period_end=${s.cancel_at_period_end}`));

        // With persistent starter, we look for 'active', 'trialing', 'past_due' (and maybe 'incomplete' if previous attempt failed)
        const activeSub = subscriptions.data.find(sub => ['active', 'trialing', 'past_due', 'incomplete'].includes(sub.status));
        console.log("PaymentService: Active subscription selected:", activeSub?.id);

        // Get env vars
        const starterPriceId = process.env.STRIPE_PRICE_ID_STARTER;
        if (!starterPriceId) throw new Error("STRIPE_PRICE_ID_STARTER missing");

        // Fetch user profile to check trial eligibility
        const { data: profile } = await this.supabase
            .from('profiles')
            .select('trial')
            .eq('id', userId)
            .single();

        console.debug("*** PaymentService: Profile trial status:", profile?.trial);
        const hasUsedTrial = profile?.trial ?? false;
        const trialDays = hasUsedTrial ? 0 : 30;
        console.debug("*** PaymentService: Calculated trialDays:", trialDays);

        if (activeSub) {
            const currentPriceId = activeSub.items.data[0]?.price.id;
            console.log(`PaymentService: Active sub ${activeSub.id} has price ${currentPriceId}`);
            console.log(`PaymentService: Comparing against Starter: ${starterPriceId} and Premium: ${priceId}`);

            // Case A: Already Premium (or some other paid plan)
            if (currentPriceId === priceId) {
                console.log("PaymentService: Detected already Premium. Returning SetupIntent for update.");
                // Return SetupIntent to allow updating payment method
                // Logic: If they are here, they might want to switch cards or reactivate
                const setupIntent = await stripe.setupIntents.create({
                    customer: customerId,
                    payment_method_types: ['card'],
                    metadata: { subscription_id: activeSub.id }
                });
                return {
                    clientSecret: setupIntent.client_secret!,
                    customerId,
                    subscriptionId: activeSub.id,
                    plan: 'premium',
                    mode: 'setup'
                };
            }

            // Case B: Starter Plan -> Upgrade to Premium
            if (currentPriceId === starterPriceId) {
                console.log("PaymentService: Upgrading from Starter to Premium");

                const updateParams: any = {
                    items: [{
                        id: activeSub.items.data[0].id,
                        price: priceId, // Premium
                    }],
                };

                if (trialDays > 0) {
                    console.log(`PaymentService: Upgrading with Trial (${trialDays} days)`);
                    // Upgrade with Trial
                    // stripe.subscriptions.update does not support trial_period_days. Use trial_end.
                    const trialEndTimestamp = Math.floor(Date.now() / 1000) + (trialDays * 24 * 60 * 60);
                    updateParams.trial_end = trialEndTimestamp;

                    await stripe.subscriptions.update(activeSub.id, updateParams);
                    console.log("PaymentService: Subscription updated with trial end");

                    // Create SetupIntent
                    const setupIntent = await stripe.setupIntents.create({
                        customer: customerId,
                        payment_method_types: ['card'],
                        metadata: { subscription_id: activeSub.id }
                    });
                    console.log("PaymentService: Created SetupIntent for trial");

                    // Update Supabase trial info
                    const startDate = new Date().toISOString();
                    const endDate = new Date(trialEndTimestamp * 1000).toISOString();
                    await this.supabase.from('profiles').update({
                        trial: true,
                        premium_trial_started_at: startDate,
                        premium_trial_end_at: endDate,
                        premium_end_at: null,
                        subscription_plan: 'premium'
                    } as any).eq('id', userId);

                    return {
                        clientSecret: setupIntent.client_secret!,
                        customerId,
                        subscriptionId: activeSub.id,
                        plan: 'premium',
                        mode: 'setup'
                    };

                } else {
                    // Upgrade with Immediate Charge
                    updateParams.payment_behavior = 'default_incomplete';
                    updateParams.proration_behavior = 'always_invoice'; // FORCE immediate invoice
                    updateParams.payment_settings = {
                        save_default_payment_method: 'on_subscription',
                        payment_method_types: ['card']
                    };
                    updateParams.expand = ['latest_invoice.payment_intent'];

                    console.debug("*** PaymentService: Sending updateParams to Stripe (Immediate Charge):", JSON.stringify(updateParams, null, 2));

                    const updatedSub = await stripe.subscriptions.update(activeSub.id, updateParams);

                    // Handle Payment Intent retrieval (same logic as creation)
                    let invoice = updatedSub.latest_invoice as Stripe.Invoice;

                    if (invoice) {
                        console.debug(`*** PaymentService: Invoice created: ${typeof invoice === 'string' ? invoice : invoice.id}, Status: ${typeof invoice !== 'string' ? invoice.status : 'N/A'}, Amount: ${typeof invoice !== 'string' ? invoice.amount_due : 'N/A'}`);
                    } else {
                        console.error("*** PaymentService: NO INVOICE CREATED via update!");
                    }

                    let paymentIntent = (invoice as any).payment_intent as Stripe.PaymentIntent;

                    if (!paymentIntent && invoice && (invoice as any).payment_intent) {
                        if (typeof (invoice as any).payment_intent === 'string') {
                            console.debug("*** PaymentService: Fetching PI from ID:", (invoice as any).payment_intent);
                            paymentIntent = await stripe.paymentIntents.retrieve((invoice as any).payment_intent);
                        }
                    }

                    // Fallback: If still no PI, retrieve invoice with expansion
                    if (!paymentIntent && invoice) {
                        const invoiceId = typeof invoice === 'string' ? invoice : invoice.id;
                        console.debug("*** PaymentService: Fetching invoice to find PI:", invoiceId);
                        const fullInvoice = await stripe.invoices.retrieve(invoiceId, { expand: ['payment_intent'] });
                        paymentIntent = (fullInvoice as any).payment_intent as Stripe.PaymentIntent;
                    }

                    if (!paymentIntent) {
                        console.error("*** PaymentService: CRITICAL - No PaymentIntent found even after retries.");
                        throw new Error("No payment intent found for upgrade.");
                    }

                    // Update Supabase
                    await this.supabase.from('profiles').update({
                        cancellation: false,
                        premium_end_at: null,
                        subscription_plan: 'premium'
                    } as any).eq('id', userId);

                    return {
                        clientSecret: paymentIntent.client_secret!,
                        customerId,
                        subscriptionId: updatedSub.id,
                        plan: 'premium',
                        mode: 'payment'
                    };
                }
            }
        }

        // Fallback: Create new subscription if none exists (should not happen with persistent starter)
        // ... (Keep existing creation logic as fallback) ...
        // Actually, let's keep the existing logic below but wrapped in 'else' or just proceed if no activeSub found.

        // existing creation logic continues here...
        // 3. Create new subscription if none exists
        const subscriptionParams: any = {
            customer: customerId,
            items: [{ price: priceId }],
            payment_behavior: 'default_incomplete',
        };

        if (trialDays > 0) {
            subscriptionParams.trial_period_days = trialDays;
            subscriptionParams.payment_settings = { save_default_payment_method: 'on_subscription' };
            subscriptionParams.expand = ['pending_setup_intent', 'latest_invoice.payment_intent'];
        } else {
            // Immediate charge
            // Explicitly define payment settings to ensure PaymentIntent is created
            subscriptionParams.payment_settings = {
                save_default_payment_method: 'on_subscription',
                payment_method_types: ['card']
            };
            subscriptionParams.expand = ['latest_invoice.payment_intent'];
        }

        const subscription = await stripe.subscriptions.create(subscriptionParams);

        // Determine if we need to confirm a SetupIntent (trial) or PaymentIntent (immediate charge)
        let clientSecret = "";
        let mode = "setup";

        if (trialDays > 0) {
            let setupIntent = subscription.pending_setup_intent as Stripe.SetupIntent | null;

            // If no setup intent was created (e.g. trial with no immediate payment required), create one manually
            if (!setupIntent) {
                console.log("PaymentService: No pending_setup_intent from subscription. Creating manual SetupIntent.");
                setupIntent = await stripe.setupIntents.create({
                    customer: customerId,
                    payment_method_types: ['card'],
                    metadata: { subscription_id: subscription.id }
                });
            }
            clientSecret = setupIntent.client_secret!;
            mode = "setup";

            // Mark trial as used
            const startDate = new Date().toISOString();
            const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

            await this.supabase.from('profiles').update({
                trial: true,
                premium_trial_started_at: startDate,
                premium_trial_end_at: endDate,
                premium_end_at: null, // Clear any previous cancellation date
                subscription_plan: 'premium'
            } as any).eq('id', userId);

        } else {
            // Immediate charge
            let invoice = subscription.latest_invoice as Stripe.Invoice;

            // Debug logging
            console.log("PaymentService: Subscription created (mode=payment). ID:", subscription.id);
            console.log("PaymentService: latest_invoice type:", typeof invoice);
            if (typeof invoice === 'object') {
                console.log("PaymentService: latest_invoice.id:", invoice?.id);
                console.log("PaymentService: latest_invoice.payment_intent:", (invoice as any).payment_intent);
            } else {
                console.log("PaymentService: latest_invoice is a string:", invoice);
            }

            let paymentIntent = (invoice as any).payment_intent as Stripe.PaymentIntent;

            // Log subscription status
            console.log(`PaymentService: Subscription status: ${subscription.status}`);

            if (!paymentIntent) {
                console.log("PaymentService: Payment Intent missing. Retrying retrieval with explicit expansion...");
                const invoiceId = typeof invoice === 'string' ? invoice : invoice.id;
                invoice = await stripe.invoices.retrieve(invoiceId, {
                    expand: ['payment_intent']
                });
                paymentIntent = (invoice as any).payment_intent as Stripe.PaymentIntent;
            }

            if (!paymentIntent) {
                // Second fallback: list payment intents for this invoice
                // Sometimes the link is not reflected in the invoice object immediately?
                console.log("PaymentService: PI still missing. Listing PIs for invoice...");
                const invoiceId = typeof invoice === 'string' ? invoice : invoice.id;
                const pis = await stripe.paymentIntents.list({ invoice: invoiceId } as any);

                if (pis.data.length > 0) {
                    paymentIntent = pis.data[0];
                    console.log("PaymentService: Found PI via search:", paymentIntent.id);
                }
            }

            if (!paymentIntent) {
                console.error("PaymentService: Payment Intent STILL Missing from Invoice:", JSON.stringify(invoice, null, 2));

                // Last resort: if the invoice is open but has no PI, maybe try to finalize it?
                // But usually default_incomplete creates it.
                // Let's trying to create a PI manually is complicated because it must be linked to the invoice.
                // For now, throw detailed error.
                throw new Error("No payment intent found for immediate charge subscription. Invoice status: " + invoice.status);
            }

            clientSecret = paymentIntent.client_secret!;
            mode = "payment";

            // Update profiles.cancellation = false AND set trial_end from stripe if any (should be null or past)
            // If no trial given, we still update cancellation
            const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null;
            await this.supabase.from('profiles').update({
                cancellation: false,
                premium_trial_end_at: trialEnd,
                premium_end_at: null, // Clear any previous cancellation date
                subscription_plan: 'premium'
            } as any).eq('id', userId);
        }

        return {
            clientSecret: clientSecret,
            customerId,
            subscriptionId: subscription.id,
            plan: 'premium',
            mode // Return mode to frontend
        };
    }

    async updateSubscription(userEmail: string, userId: string, appMetadata: any, newPlan: 'premium' | 'starter') {
        let customerId = appMetadata?.stripe_customer_id;

        // Validation helper
        customerId = await this.resolveStaleCustomerId(customerId);

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
                    let updatedSub = activeSub;

                    // If it was scheduled for cancellation, we must un-cancel it (Reactivate)
                    if (activeSub.cancel_at_period_end) {
                        updatedSub = await stripe.subscriptions.update(activeSub.id, {
                            cancel_at_period_end: false,
                        });
                    } else {
                        // Even if active, fetch fresh to be sure about dates
                        updatedSub = await stripe.subscriptions.retrieve(activeSub.id);
                    }

                    // Update profiles to ensure sync even if webhook failed
                    const updatedSubAny = updatedSub as any;
                    console.log(`*** PaymentService Debug: Retrieved FRESH sub ${updatedSub.id}`);
                    console.log(`*** PaymentService Debug: current_period_end raw=${updatedSubAny.current_period_end}`);

                    const trialEnd = updatedSub.trial_end ? new Date(updatedSub.trial_end * 1000).toISOString() : null;

                    let premiumEnd = null;
                    if (updatedSubAny.current_period_end) {
                        premiumEnd = new Date(updatedSubAny.current_period_end * 1000).toISOString();
                        console.log(`*** PaymentService Debug: Calculated premiumEnd=${premiumEnd}`);
                    } else {
                        console.log("*** PaymentService Debug: current_period_end is MISSING or Falsy on FRESH fetch!");
                    }

                    await this.supabase.from('profiles').update({
                        cancellation: false,
                        premium_trial_end_at: trialEnd,
                        premium_end_at: premiumEnd, // Always sync the end date!
                        subscription_plan: 'premium'
                    } as any).eq('id', userId);

                    return {
                        status: activeSub.cancel_at_period_end ? 'reactivated' : 'already_premium',
                        subscriptionId: updatedSub.id,
                        currentPeriodEnd: updatedSubAny.current_period_end
                    };
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
                    premium_end_at: null, // Clear any previous cancellation date
                    // We don't mark trial=true here typically because upgrade implies they already had a sub?
                    // Or if they were on starter? Starter is usually no sub in this system.
                    // If they upgrade from a hypothetical paid-non-trial plan to another, trial logic might not apply.
                    // But in this app, "Starter" = no sub. So we only hit this block if they have a sub that is NOT premium price?
                    // If they have a sub, they probably already used trial or are paying.
                    // Let's assume upgrade doesn't grant new trial unless explicitly handled.
                    subscription_plan: 'premium'
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

                // If we gave a trial, mark it as used and record dates
                if (trialDays > 0) {
                    const startDate = new Date().toISOString();
                    const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

                    await this.supabase.from('profiles').update({
                        trial: true,
                        premium_trial_started_at: startDate,
                        premium_trial_end_at: endDate,
                        cancellation: false,
                        subscription_plan: 'premium'
                    } as any).eq('id', userId);
                } else {
                    // Update profiles.cancellation = false AND set trial_end from stripe if any (should be null or past)
                    // If no trial given, we still update cancellation
                    const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null;
                    await this.supabase.from('profiles').update({
                        cancellation: false,
                        premium_trial_end_at: trialEnd,
                        premium_end_at: null, // Clear any previous cancellation date
                        subscription_plan: 'premium'
                    } as any).eq('id', userId);
                }

                // Return 'created' so API wrapper can confirm
                return { status: 'created', subscriptionId: subscription.id };

                return { status: 'created', subscriptionId: subscription.id };
            }
        } else {
            // Downgrade to Starter (Cancel Premium)
            if (activeSub) {
                const currentPriceId = activeSub.items.data[0]?.price.id;
                const starterPriceId = process.env.STRIPE_PRICE_ID_STARTER;

                if (currentPriceId === starterPriceId) {
                    console.log("PaymentService: Already on Starter plan. No action needed.");
                    return { status: 'already_starter', subscriptionId: activeSub.id };
                }

                const endDate = (activeSub as any).current_period_end || Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);

                const updatedSub = await stripe.subscriptions.update(activeSub.id, {
                    cancel_at_period_end: true,
                });

                // Update profiles.cancellation = true AND set expected end date
                // Use the updated subscription's cancel_at (timestamp) or current_period_end
                const cancelTimestamp = updatedSub.cancel_at || (updatedSub as any).current_period_end;
                const finalDate = new Date(cancelTimestamp * 1000).toISOString();
                await this.supabase.from('profiles').update({
                    cancellation: true,
                    premium_end_at: finalDate
                } as any).eq('id', userId);

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

        // Validation helper
        customerId = await this.resolveStaleCustomerId(customerId);

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

        console.log("PaymentService: activeSub found?", activeSub ? "YES" : "NO", activeSub?.status);

        // Resolve Stripe Plan
        let stripePlan = 'starter';
        if (activeSub && activeSub.items.data[0]?.price.id === process.env.STRIPE_PRICE_ID_PREMIUM) {
            stripePlan = 'premium';
        }

        console.log("PaymentService: Resolved stripePlan:", stripePlan);

        // Self-healing: Check DB and update if mismatched
        try {
            const { data: profile } = await this.supabase
                .from('profiles')
                .select('subscription_plan, cancellation, premium_end_at')
                .eq('id', userId)
                .single();

            console.log("PaymentService: Current DB Profile:", profile);

            if (profile) {
                let needsUpdate = false;
                const updates: any = {};

                // 1. Sync Plan
                if (profile.subscription_plan !== stripePlan) {
                    console.log(`PaymentService: Syncing mismatch. DB=${profile.subscription_plan}, Stripe=${stripePlan}`);
                    updates.subscription_plan = stripePlan;
                    needsUpdate = true;
                }

                // 2. Sync Cancellation Status
                if (activeSub?.cancel_at_period_end !== undefined) {
                    if (profile.cancellation !== activeSub.cancel_at_period_end) {
                        console.log(`PaymentService: Syncing cancellation. DB=${profile.cancellation}, Stripe=${activeSub.cancel_at_period_end}`);
                        updates.cancellation = activeSub.cancel_at_period_end;
                        needsUpdate = true;
                    }

                    // Sync End Date if cancelled
                    if (activeSub.cancel_at_period_end && (activeSub as any).current_period_end) {
                        const stripeEnd = new Date((activeSub as any).current_period_end * 1000).toISOString();
                        if (profile.premium_end_at !== stripeEnd) {
                            updates.premium_end_at = stripeEnd;
                            needsUpdate = true;
                        }
                    } else if (!activeSub.cancel_at_period_end && profile.premium_end_at) {
                        // If not cancelled (reactivated), clear end date
                        updates.premium_end_at = null;
                        needsUpdate = true;
                    }
                }

                if (needsUpdate) {
                    await this.supabase.from('profiles').update(updates).eq('id', userId);
                }
            }
        } catch (e) {
            console.error("PaymentService: Error during self-healing sync", e);
        }

        if (activeSub) {
            return {
                id: activeSub.id,
                status: activeSub.status,
                cancel_at_period_end: activeSub.cancel_at_period_end,
                current_period_end: (activeSub as any).current_period_end,
                plan: stripePlan
            };
        }
        return null; // Implies starter/none logic in frontend
    }

    async setDefaultPaymentMethod(userId: string, userEmail: string, appMetadata: any, paymentMethodId: string) {
        let customerId = appMetadata?.stripe_customer_id;

        // Validation helper
        customerId = await this.resolveStaleCustomerId(customerId);

        if (!customerId && userEmail) {
            const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
            if (customers.data.length > 0) customerId = customers.data[0].id;
        }

        if (!customerId) throw new Error("No customer found");

        // 1. Update Customer Default
        await stripe.customers.update(customerId, {
            invoice_settings: { default_payment_method: paymentMethodId }
        });

        // 2. Update Active Subscription Default (to null, so it uses customer default)
        const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
        });

        const activeSub = subscriptions.data.find(sub => ['active', 'trialing', 'past_due'].includes(sub.status));

        if (activeSub) {
            await stripe.subscriptions.update(activeSub.id, {
                default_payment_method: null as any,
            });

            // If subscription was cancelling, reactivate it
            if (activeSub.cancel_at_period_end) {
                console.log(`PaymentService: Reactivating subscription ${activeSub.id} because new payment method was set.`);
                await this.reactivateSubscription(activeSub.id, userId);
            }
        }

        return { status: 'success' };
    }

    async removePaymentMethod(userId: string, userEmail: string, appMetadata: any, paymentMethodId: string) {
        let customerId = appMetadata?.stripe_customer_id;

        // Validation helper
        customerId = await this.resolveStaleCustomerId(customerId);

        if (!customerId) throw new Error("No customer found");

        try {
            // 1. Detach payment method
            await stripe.paymentMethods.detach(paymentMethodId);
            console.log(`PaymentService: Detached payment method ${paymentMethodId}`);

            // 2. Handle Subscription Cancellation (Downgrade)
            const subscriptions = await stripe.subscriptions.list({
                customer: customerId,
                status: 'all',
                limit: 1,
            });

            const activeSub = subscriptions.data.find(sub => ['active', 'trialing', 'past_due'].includes(sub.status));

            if (activeSub) {
                // Check if it's already Starter
                const currentPriceId = activeSub.items.data[0]?.price.id;
                const starterPriceId = process.env.STRIPE_PRICE_ID_STARTER;

                if (currentPriceId !== starterPriceId) {
                    // It is Premium (or other), so cancel at period end
                    const updatedSub = await stripe.subscriptions.update(activeSub.id, {
                        cancel_at_period_end: true,
                    });

                    // Update profiles
                    const finalDate = (updatedSub as any).current_period_end
                        ? new Date((updatedSub as any).current_period_end * 1000).toISOString()
                        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

                    await this.supabase.from('profiles').update({
                        cancellation: true,
                        premium_end_at: finalDate
                    } as any).eq('id', userId);

                    console.log(`PaymentService: Subscription ${activeSub.id} set to cancel at period end.`);
                } else {
                    console.log("PaymentService: User is on Starter plan. No subscription cancellation needed.");
                }
            }

            return { status: 'success' };
        } catch (error) {
            console.error("PaymentService.removePaymentMethod: Error", error);
            throw error;
        }
    }

    async deleteCustomer(userId: string, userEmail: string, appMetadata: any) {
        let customerId = appMetadata?.stripe_customer_id;

        // Validation helper
        customerId = await this.resolveStaleCustomerId(customerId);

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

                // Remove Stripe ID from user metadata
                await this.supabase.auth.admin.updateUserById(userId, {
                    app_metadata: {
                        stripe_customer_id: null,
                        stripe_subscription_id: null,
                    }
                });
            } catch (error) {
                console.error(`PaymentService.deleteCustomer: Failed to delete Stripe customer ${customerId}`, error);
                throw error;
            }
        } else {
            console.log("PaymentService.deleteCustomer: No Stripe customer found to delete.");
        }
    }

    /**
     * Reactivates a subscription by setting cancel_at_period_end to false
     * and clearing the cancellation date in the profile.
     */
    async reactivateSubscription(subscriptionId: string, userId: string) {
        try {
            // 1. Update Stripe
            await stripe.subscriptions.update(subscriptionId, {
                cancel_at_period_end: false,
            });

            // 2. Update Supabase Profile
            await this.supabase.from('profiles').update({
                cancellation: false,
                premium_end_at: null
            } as any).eq('id', userId);

            console.log(`PaymentService: Successfully reactivated subscription ${subscriptionId} for user ${userId}`);
            return { status: 'reactivated' };
        } catch (error: any) {
            console.error(`PaymentService: Failed to reactivate subscription ${subscriptionId}`, error);
            throw error;
        }
    }

    /**
     * Verifies if a Stripe Customer ID is valid and exists.
     * If it's deleted or missing, returns null.
     * This handles cases where the local DB/Session has a stale ID.
     */
    private async resolveStaleCustomerId(customerId: string | undefined | null): Promise<string | null> {
        if (!customerId) return null;

        try {
            const customer = await stripe.customers.retrieve(customerId);
            if (customer.deleted) {
                console.log(`PaymentService: Customer ${customerId} is deleted. Treating as null.`);
                return null;
            }
            return customer.id;
        } catch (error: any) {
            // Check for specific Stripe error code or message
            if (
                error?.code === 'resource_missing' ||
                (error?.message && error.message.includes("No such customer"))
            ) {
                console.log(`PaymentService: Customer ${customerId} not found (404/No such customer). Treating as null.`);
                return null;
            }

            // Re-throw other errors
            throw error;
        }
    }
}
