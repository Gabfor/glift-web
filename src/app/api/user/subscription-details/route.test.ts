import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetSubscriptionDetails = vi.fn();
const mockGetUser = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

vi.mock('@/lib/services/paymentService', () => ({
  PaymentService: class {
    getSubscriptionDetails = mockGetSubscriptionDetails;
  },
}));

import { GET } from './route';

describe('GET /api/user/subscription-details', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes userId, email and app_metadata in the correct order', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user_123',
          email: 'user@example.com',
          app_metadata: { stripe_customer_id: 'cus_123' },
          user_metadata: { stripe_customer_id: 'wrong_source' },
        },
      },
      error: null,
    });

    mockGetSubscriptionDetails.mockResolvedValue({ status: 'active' });

    const res = await GET(new Request('http://localhost/api/user/subscription-details'));

    expect(res.status).toBe(200);
    expect(mockGetSubscriptionDetails).toHaveBeenCalledWith(
      'user_123',
      'user@example.com',
      { stripe_customer_id: 'cus_123' },
    );
  });
});
