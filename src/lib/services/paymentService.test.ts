
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentService } from './paymentService';

// Define the mock instance using vi.hoisted so it's initialized before vi.mock
const { mockStripeInstance } = vi.hoisted(() => {
    return {
        mockStripeInstance: {
            customers: {
                list: vi.fn(),
                create: vi.fn(),
                retrieve: vi.fn(),
                update: vi.fn(),
                del: vi.fn(),
            },
            subscriptions: {
                list: vi.fn(),
                create: vi.fn(),
                retrieve: vi.fn(),
                update: vi.fn(),
            },
            paymentMethods: {
                list: vi.fn(),
            },
        }
    };
});

// Mock Stripe module to return a class constructor that returns our hoisted mock instance
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
    from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
        maybeSingle: vi.fn(),
        update: vi.fn().mockReturnThis(),
    })),
    auth: {
        admin: {
            updateUserById: vi.fn(),
        },
    },
};

describe('PaymentService', () => {
    let paymentService: PaymentService;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubEnv('STRIPE_PRICE_ID_PREMIUM', 'price_premium_test');
        vi.stubEnv('STRIPE_PRICE_ID_STARTER', 'price_starter_test');
        paymentService = new PaymentService(mockSupabase as any);
    });

    describe('updateSubscription', () => {
        it('should upgrade to premium correctly', async () => {
            // Setup data
            const userId = 'user_123';
            const email = 'test@example.com';
            const customerId = 'cus_123';
            const mockMetadata = { stripe_customer_id: customerId };

            // Setup mocks
            mockStripeInstance.customers.retrieve.mockResolvedValue({ id: customerId, deleted: false });

            mockStripeInstance.subscriptions.list.mockResolvedValue({
                data: [{
                    id: 'sub_starter',
                    status: 'active',
                    items: { data: [{ id: 'si_123', price: { id: 'price_starter' } }] }
                }]
            });

            mockStripeInstance.subscriptions.update.mockResolvedValue({
                id: 'sub_starter',
                status: 'active',
                current_period_end: 1735689600, // Future date
            });

            // Execute
            const result = await paymentService.updateSubscription(email, userId, mockMetadata, 'premium');

            // Assertions
            expect(mockStripeInstance.subscriptions.update).toHaveBeenCalledWith('sub_starter', expect.objectContaining({
                items: expect.arrayContaining([
                    expect.objectContaining({ price: 'price_premium_test' })
                ]),
                cancel_at_period_end: false
            }));

            expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
        });
    });
});
