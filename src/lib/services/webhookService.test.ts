
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebhookService } from './webhookService';
import Stripe from 'stripe';

// Mock Stripe
const { mockStripeInstance } = vi.hoisted(() => {
    return {
        mockStripeInstance: {
            customers: {
                retrieve: vi.fn(),
                create: vi.fn(),
                update: vi.fn(),
            },
            subscriptions: {
                list: vi.fn(),
                create: vi.fn(),
                retrieve: vi.fn(),
                update: vi.fn(),
            },
            webhooks: {
                constructEvent: vi.fn(),
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
const mockFromReturn = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    update: vi.fn().mockReturnThis(),
};

const mockSupabase = {
    from: vi.fn(() => mockFromReturn),
    auth: {
        admin: {
            listUsers: vi.fn(),
            updateUserById: vi.fn(),
        },
    },
};

describe('WebhookService', () => {
    let webhookService: WebhookService;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubEnv('STRIPE_PRICE_ID_STARTER', 'price_starter_test');
        webhookService = new WebhookService(mockSupabase as any);
    });

    describe('customer.subscription.deleted', () => {
        it('should recreate starter subscription if user has no other active subs', async () => {
            const customerId = 'cus_123';
            const userId = 'user_123';
            const oldSubId = 'sub_old';
            const newSubId = 'sub_new_starter';

            // Mock Stripe responses
            mockStripeInstance.customers.retrieve.mockResolvedValue({ id: customerId, deleted: false });
            mockStripeInstance.subscriptions.list.mockResolvedValue({ data: [] }); // No other active subs
            mockStripeInstance.subscriptions.create.mockResolvedValue({ id: newSubId });

            // Mock Supabase responses
            mockSupabase.auth.admin.listUsers.mockResolvedValue({
                data: { users: [{ id: userId, app_metadata: { stripe_customer_id: customerId } }] },
                error: null
            });

            // Event payload
            const event = {
                type: 'customer.subscription.deleted',
                data: {
                    object: {
                        id: oldSubId,
                        customer: customerId,
                        status: 'canceled',
                    } as any
                }
            } as Stripe.Event;

            await webhookService.handleEvent(event);

            // Assertions
            expect(mockStripeInstance.subscriptions.create).toHaveBeenCalledWith({
                customer: customerId,
                items: [{ price: 'price_starter_test' }]
            });

            expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
            expect(mockStripeInstance.subscriptions.create).toHaveBeenCalledWith({
                customer: customerId,
                items: [{ price: 'price_starter_test' }]
            });

            expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
            expect(mockFromReturn.update).toHaveBeenCalledWith(expect.objectContaining({
                subscription_plan: 'starter'
            }));
        });

        it('should NOT recreate starter subscription if user has other active subs', async () => {
            const customerId = 'cus_123';
            const oldSubId = 'sub_old';
            const userId = 'user_123'; // Added userId for better mocking context if needed

            // Mock Stripe responses
            mockStripeInstance.customers.retrieve.mockResolvedValue({ id: customerId, deleted: false });
            mockStripeInstance.subscriptions.list.mockResolvedValue({
                data: [{ id: 'sub_active', status: 'active' }]
            }); // Other active sub exists

            // Should also mock listUsers to avoid "undefined" errors if logic reaches it
            mockSupabase.auth.admin.listUsers.mockResolvedValue({
                data: { users: [{ id: userId, app_metadata: { stripe_customer_id: customerId } }] },
                error: null
            });

            // Event payload
            const event = {
                type: 'customer.subscription.deleted',
                data: {
                    object: {
                        id: oldSubId,
                        customer: customerId,
                        status: 'canceled',
                    } as any
                }
            } as Stripe.Event;

            await webhookService.handleEvent(event);

            expect(mockStripeInstance.subscriptions.create).not.toHaveBeenCalled();
        });


        it('should find user by email fallback if metadata missing', async () => {
            const customerId = 'cus_fallback';
            const userId = 'user_fallback';
            const email = 'fallback@example.com';

            mockStripeInstance.customers.retrieve.mockResolvedValue({ id: customerId, email: email, deleted: false });
            mockStripeInstance.subscriptions.list.mockResolvedValue({ data: [] });
            mockStripeInstance.subscriptions.create.mockResolvedValue({ id: 'sub_new' });

            // Supabase returns user matching email but missing metadata
            mockSupabase.auth.admin.listUsers.mockResolvedValue({
                data: { users: [{ id: userId, email: email, app_metadata: {} }] },
                error: null
            });

            const event = {
                type: 'customer.subscription.deleted',
                data: {
                    object: { id: 'sub_old', customer: customerId } as any
                }
            } as Stripe.Event;

            await webhookService.handleEvent(event);

            // Should update metadata
            expect(mockSupabase.auth.admin.updateUserById).toHaveBeenCalledWith(userId, expect.objectContaining({
                app_metadata: expect.objectContaining({ stripe_customer_id: customerId })
            }));

            // Should update profile
            expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
        });
    });

    describe('invoice.payment_succeeded', () => {
        it('should update profile trial/end metrics on success', async () => {
            const customerId = 'cus_pay';
            const userId = 'user_pay';
            const periodEnd = 1735689600;

            mockSupabase.auth.admin.listUsers.mockResolvedValue({
                data: { users: [{ id: userId, app_metadata: { stripe_customer_id: customerId } }] },
                error: null
            });

            const event = {
                type: 'invoice.payment_succeeded',
                data: {
                    object: {
                        customer: customerId,
                        subscription: 'sub_pay',
                        lines: {
                            data: [{ period: { end: periodEnd } }]
                        }
                    } as any
                }
            } as Stripe.Event;

            await webhookService.handleEvent(event);

            expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
            expect(mockFromReturn.update).toHaveBeenCalledWith(expect.objectContaining({
                trial: true
            }));
        });

        it('should fail gracefully if customer not found', async () => {
            const customerId = 'cus_ghost';

            mockSupabase.auth.admin.listUsers.mockResolvedValue({
                data: { users: [] },
                error: null
            });

            mockStripeInstance.customers.retrieve.mockRejectedValue(new Error("Customer not found"));

            const event = {
                type: 'invoice.payment_succeeded',
                data: { object: { customer: customerId, subscription: 'sub_ghost' } as any }
            } as Stripe.Event;

            // Should not throw, but log error
            await expect(webhookService.handleEvent(event)).resolves.not.toThrow();
            expect(mockSupabase.from).not.toHaveBeenCalled();
        });
    });
});
