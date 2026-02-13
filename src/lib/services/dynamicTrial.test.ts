import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentService } from './paymentService';

// Mock Stripe
const { mockStripeInstance } = vi.hoisted(() => {
    return {
        mockStripeInstance: {
            customers: {
                list: vi.fn(),
                create: vi.fn(),
                retrieve: vi.fn(),
            },
            subscriptions: {
                list: vi.fn(),
                create: vi.fn(),
                update: vi.fn(),
            },
            setupIntents: {
                create: vi.fn(),
            }
        }
    };
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

// Mock Supabase
const mockSupabase = {
    from: vi.fn(),
    auth: {
        admin: {
            updateUserById: vi.fn(),
        },
    },
};

describe('PaymentService - Dynamic Trial', () => {
    let paymentService: PaymentService;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubEnv('STRIPE_PRICE_ID_PREMIUM', 'price_premium');
        vi.stubEnv('STRIPE_PRICE_ID_STARTER', 'price_starter');
        paymentService = new PaymentService(mockSupabase as any);
    });

    it('should use 7 days trial when configured in settings', async () => {
        const userId = 'user_dynamic';
        const email = 'dynamic@example.com';
        const customerId = 'cus_dynamic';

        // Mock Supabase responses
        const mockFrom = vi.fn((table) => {
            if (table === 'profiles') {
                return {
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({ data: { trial: false } }) // User hasn't used trial
                        })
                    }),
                    update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({}) })
                };
            }
            if (table === 'settings') {
                return {
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({ data: { value: '7' } }) // Configured to 7 days
                        })
                    })
                };
            }
            return {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn(),
                update: vi.fn().mockReturnThis(),
            };
        });
        mockSupabase.from = mockFrom;

        // Mock Stripe responses
        mockStripeInstance.customers.retrieve.mockResolvedValue({ id: customerId, deleted: false });
        // Mock existing Starter subscription
        mockStripeInstance.subscriptions.list.mockResolvedValue({
            data: [{
                id: 'sub_starter',
                status: 'active',
                items: { data: [{ id: 'si_starter', price: { id: 'price_starter' } }] }
            }]
        });
        mockStripeInstance.subscriptions.update.mockResolvedValue({ id: 'sub_starter' });
        mockStripeInstance.setupIntents.create.mockResolvedValue({ client_secret: 'seti_secret' });

        // Execute
        await paymentService.createSubscriptionSetup(email, userId, { stripe_customer_id: customerId });

        // Verify Stripe update called with correct trial_end
        const updateCall = mockStripeInstance.subscriptions.update.mock.calls[0];
        const updateParams = updateCall[1];

        expect(updateParams).toHaveProperty('trial_end');

        const nowSeconds = Math.floor(Date.now() / 1000);
        const expectedTrialEnd = nowSeconds + (7 * 24 * 60 * 60);

        // Allow small delta (2s)
        expect(updateParams.trial_end).toBeGreaterThanOrEqual(expectedTrialEnd - 2);
        expect(updateParams.trial_end).toBeLessThanOrEqual(expectedTrialEnd + 2);
    });

    it('should default to 30 days trial when setting is missing', async () => {
        const userId = 'user_default';
        const email = 'default@example.com';
        const customerId = 'cus_default';

        // Mock Supabase to return null/empty for settings
        const mockFrom = vi.fn((table) => {
            if (table === 'profiles') {
                return {
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({ data: { trial: false } })
                        })
                    }),
                    update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({}) })
                };
            }
            if (table === 'settings') {
                return {
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({ data: null }) // Setting missing
                        })
                    })
                };
            }
            return {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn(),
                update: vi.fn().mockReturnThis(),
            };
        });
        mockSupabase.from = mockFrom;

        mockStripeInstance.customers.retrieve.mockResolvedValue({ id: customerId, deleted: false });
        mockStripeInstance.subscriptions.list.mockResolvedValue({
            data: [{
                id: 'sub_starter_def',
                status: 'active',
                items: { data: [{ id: 'si_starter_def', price: { id: 'price_starter' } }] }
            }]
        });
        mockStripeInstance.subscriptions.update.mockResolvedValue({ id: 'sub_starter_def' });
        mockStripeInstance.setupIntents.create.mockResolvedValue({ client_secret: 'seti_secret' });

        await paymentService.createSubscriptionSetup(email, userId, { stripe_customer_id: customerId });

        const updateCall = mockStripeInstance.subscriptions.update.mock.calls[0];
        const updateParams = updateCall[1];

        const nowSeconds = Math.floor(Date.now() / 1000);
        const expectedTrialEnd = nowSeconds + (30 * 24 * 60 * 60);

        expect(updateParams.trial_end).toBeLessThanOrEqual(expectedTrialEnd + 2);
    });

    it('should use 1 hour trial when configured (fractional days)', async () => {
        const userId = 'user_hour';
        const email = 'hour@example.com';
        const customerId = 'cus_hour';
        const mockNow = 1678886400000; // 2023-03-15T13:20:00.000Z
        vi.setSystemTime(mockNow);

        // Mock configured trial days to 1 hour (approx 0.0416667)
        const oneHourInDays = "0.0416667";

        const mockFrom = vi.fn((table) => {
            if (table === 'settings') {
                return {
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({ data: { value: oneHourInDays } })
                        })
                    })
                };
            }
            if (table === 'profiles') {
                return {
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({ data: { trial: false } })
                        })
                    }),
                    update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({}) })
                };
            }
            return {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn(),
                update: vi.fn().mockReturnThis(),
            };
        });
        mockSupabase.from = mockFrom;

        mockStripeInstance.customers.retrieve.mockResolvedValue({ id: customerId, deleted: false });
        mockStripeInstance.subscriptions.list.mockResolvedValue({
            data: [{
                id: 'sub_starter_hour',
                status: 'active',
                items: { data: [{ id: 'si_hour', price: { id: 'price_starter' } }] }
            }]
        });
        mockStripeInstance.subscriptions.update.mockResolvedValue({ id: 'sub_starter_hour' });
        mockStripeInstance.setupIntents.create.mockResolvedValue({ client_secret: 'seti_secret' });

        await paymentService.createSubscriptionSetup(email, userId, { stripe_customer_id: customerId });

        const updateCall = mockStripeInstance.subscriptions.update.mock.calls[0];
        const updateParams = updateCall[1];

        // 1 hour = 3600 seconds
        const expectedTrialEndSeconds = Math.floor(mockNow / 1000) + 3600;

        expect(updateParams.trial_end).toBeDefined();
        // Allow small rounding difference check (Math.ceil vs exact) + execution time
        expect(updateParams.trial_end).toBeGreaterThanOrEqual(expectedTrialEndSeconds);
        expect(updateParams.trial_end).toBeLessThan(expectedTrialEndSeconds + 5);
    });
});
