import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetUser = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: mockSelect,
      update: vi.fn(),
    })),
  })),
}));

mockSelect.mockReturnValue({
  eq: mockEq,
});
mockEq.mockReturnValue({
  single: mockSingle,
});

import { POST } from './route';

describe('POST /api/user/sync-status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ single: mockSingle });
  });

  it('does not downgrade solely because premium_trial_end_at is in the past', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user_1', email: 'test@glift.fr' } },
      error: null,
    });

    mockSingle.mockResolvedValue({
      data: {
        subscription_plan: 'premium',
        premium_end_at: null,
        premium_trial_end_at: '2024-01-01T00:00:00.000Z',
        stripe_customer_id: null,
      },
      error: null,
    });

    const res = await POST(new Request('http://localhost/api/user/sync-status', { method: 'POST' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe('active');
  });
});
