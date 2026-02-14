import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetUser = vi.fn();
const mockAdminGetUserById = vi.fn();
const mockUpdateSubscription = vi.fn();
const mockProfilesEq = vi.fn();
const mockProfilesUpdate = vi.fn(() => ({ eq: mockProfilesEq }));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
  createAdminClient: vi.fn(() => ({
    auth: {
      admin: {
        getUserById: mockAdminGetUserById,
      },
    },
    from: vi.fn(() => ({
      update: mockProfilesUpdate,
    })),
  })),
}));

vi.mock('@/lib/services/paymentService', () => ({
  PaymentService: class {
    updateSubscription = mockUpdateSubscription;
  },
}));

import { POST } from './route';

describe('POST /api/user/update-subscription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses fresh app_metadata from admin user record when updating subscription', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user_abc',
          email: 'fresh@example.com',
          app_metadata: { stripe_customer_id: 'stale_from_jwt' },
        },
      },
      error: null,
    });

    mockAdminGetUserById.mockResolvedValue({
      data: {
        user: {
          app_metadata: { stripe_customer_id: 'cus_fresh', stripe_subscription_id: 'sub_fresh' },
        },
      },
      error: null,
    });

    mockUpdateSubscription.mockResolvedValue({ status: 'updated' });

    const req = new Request('http://localhost/api/user/update-subscription', {
      method: 'POST',
      body: JSON.stringify({ plan: 'premium' }),
      headers: { 'content-type': 'application/json' },
    });

    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockUpdateSubscription).toHaveBeenCalledWith(
      'fresh@example.com',
      'user_abc',
      { stripe_customer_id: 'cus_fresh', stripe_subscription_id: 'sub_fresh' },
      'premium',
    );
  });
});
