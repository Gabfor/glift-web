import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentService } from './paymentService';
import Stripe from 'stripe';

// Mock Stripe
const { mockStripeInstance } = vi.hoisted(() => {
    return {
        mockStripeInstance: {
            customers: {
                retrieve: vi.fn(),
                create: vi.fn(),
                list: vi.fn(),
                update: vi.fn(),
            },
            subscriptions: {
                list: vi.fn(),
                create: vi.fn(),
                retrieve: vi.fn(),
                update: vi.fn(),
            },
            setupIntents: {
                create: vi.fn(),
            },
            paymentMethods: {
                list: vi.fn(),
                retrieve: vi.fn(),
            },
            invoices: {
                retrieve: vi.fn(),
            },
            paymentIntents: {
                retrieve: vi.fn(),
                list: vi.fn(),
            }
        }
    }
});

vi.mock('stripe', () => {
    return {
        default: class {
            constructor() {
                return mockStripeInstance;
            }
        }
    };
});

describe('Signup and Upgrade Flow', () => {
    let paymentService: PaymentService;
    let mockSupabase: any;
    const userId = 'user_123';
    const email = 'test@example.com';
    const customerId = 'cus_123';
    const starterPriceId = 'price_starter_test';
    const premiumPriceId = 'price_premium_test';
    const starterSubId = 'sub_starter_123';

    beforeEach(() => {
        process.env.STRIPE_SECRET_KEY = 'sk_test_123';
        process.env.STRIPE_PRICE_ID_STARTER = starterPriceId;
        process.env.STRIPE_PRICE_ID_PREMIUM = premiumPriceId;

        mockSupabase = {
            from: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn(),
            update: vi.fn().mockReturnThis(),
            auth: {
                admin: {
                    updateUserById: vi.fn(),
                }
            }
        };

        paymentService = new PaymentService(mockSupabase as any);
        vi.clearAllMocks();
    });

    it('should upgrade to Premium correctly after Signup', async () => {
        // 1. Simulate Signup: Create Customer and Starter Subscription
        mockStripeInstance.customers.create.mockResolvedValue({ id: customerId });
        mockStripeInstance.subscriptions.create.mockResolvedValue({ id: starterSubId });

        await paymentService.createCustomerAndStarterSubscription(userId, email, 'Test User');

        expect(mockStripeInstance.customers.create).toHaveBeenCalledWith(expect.objectContaining({ email }));
        expect(mockStripeInstance.subscriptions.create).toHaveBeenCalledWith(expect.objectContaining({
            customer: customerId,
            items: [{ price: starterPriceId }]
        }));
        expect(mockSupabase.auth.admin.updateUserById).toHaveBeenCalledWith(userId, {
            app_metadata: {
                stripe_customer_id: customerId,
                stripe_subscription_id: starterSubId,
            }
        });

        // 2. Simulate User going to Payment Page (Upgrade Flow)
        // Setup mocks for createSubscriptionSetup
        const appMetadata = { stripe_customer_id: customerId };

        // Mock Customer Retrieval for resolveStaleCustomerId
        mockStripeInstance.customers.retrieve.mockResolvedValue({ id: customerId, deleted: false });

        // Mock finding the existing Starter subscription
        mockStripeInstance.subscriptions.list.mockResolvedValue({
            data: [{
                id: starterSubId,
                status: 'active',
                items: { data: [{ id: 'si_123', price: { id: starterPriceId } }] }
            }]
        });

        // Mock Profile (no trial used)
        mockSupabase.single.mockResolvedValue({ data: { trial: false } });

        // Mock Update Subscription (Upgrade with Trial)
        mockStripeInstance.subscriptions.update.mockResolvedValue({
            id: starterSubId,
            status: 'active',
            trial_end: 1234567890
        });

        const setupIntentSecret = 'seti_secret_123';
        mockStripeInstance.setupIntents.create.mockResolvedValue({
            client_secret: setupIntentSecret
        });

        // Execute Upgrade logic
        const result = await paymentService.createSubscriptionSetup(email, userId, appMetadata);

        // Verify correct Upgrade calls
        expect(mockStripeInstance.subscriptions.list).toHaveBeenCalledWith(expect.objectContaining({ customer: customerId }));

        // Should detect Starter -> Premium upgrade
        expect(mockStripeInstance.subscriptions.update).toHaveBeenCalledWith(starterSubId, expect.objectContaining({
            items: [{ id: 'si_123', price: premiumPriceId }]
        }));

        // Should return setup intent for trial
        expect(result).toEqual({
            clientSecret: setupIntentSecret,
            customerId: customerId,
            subscriptionId: starterSubId,
            plan: 'premium',
            mode: 'setup'
        });
    });

    it('should handle Immediate Payment if trial already used', async () => {
        const appMetadata = { stripe_customer_id: customerId };

        // Mock Customer Retrieval for resolveStaleCustomerId
        mockStripeInstance.customers.retrieve.mockResolvedValue({ id: customerId, deleted: false });

        // Existing Starter Sub
        mockStripeInstance.subscriptions.list.mockResolvedValue({
            data: [{
                id: starterSubId,
                status: 'active',
                items: { data: [{ id: 'si_123', price: { id: starterPriceId } }] }
            }]
        });

        // Mock Profile (Trial USED)
        mockSupabase.single.mockResolvedValue({ data: { trial: true } });

        // Mock Update Subscription (Immediate Charge)
        const updatedSubId = 'sub_premium_123';
        mockStripeInstance.subscriptions.update.mockResolvedValue({
            id: updatedSubId,
            status: 'active',
            latest_invoice: {
                id: 'inv_123',
                payment_intent: { client_secret: 'pi_secret_123', status: 'requires_payment_method' }
            }
        });

        const result = await paymentService.createSubscriptionSetup(email, userId, appMetadata);

        expect(mockStripeInstance.subscriptions.update).toHaveBeenCalledWith(starterSubId, expect.objectContaining({
            payment_behavior: 'default_incomplete',
            proration_behavior: 'always_invoice'
        }));

        expect(result).toEqual({
            clientSecret: 'pi_secret_123',
            customerId: customerId,
            subscriptionId: updatedSubId,
            plan: 'premium',
            mode: 'payment'
        });
    });
});
