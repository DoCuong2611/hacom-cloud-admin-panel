import { describe, expect, it } from 'vitest';

import { cloudFixtureApi } from './cloudFixtureApi';

describe('cloudFixtureApi', () => {
  it('returns the typed overview without making an HTTP request', async () => {
    await expect(cloudFixtureApi.readModels.getOverview()).resolves.toMatchObject({
      activeDrives: 0,
      pendingQuotaRequests: 0,
    });
  });

  it('supports Cloud-only local UI filtering and idempotent quota review', async () => {
    const page = await cloudFixtureApi.quota.list({ status: 'pending', limit: 25 });
    const request = page.items[0];

    expect(request?.id).toBe('quota-request-fixture');

    const firstReview = await cloudFixtureApi.quota.approve(request!.id, {
      idempotencyKey: 'fixture-review-1',
      note: 'Kiểm tra giao diện.',
    });
    const replay = await cloudFixtureApi.quota.approve(request!.id, {
      idempotencyKey: 'fixture-review-1',
      note: 'Kiểm tra giao diện.',
    });

    expect(firstReview.status).toBe('approved');
    expect(firstReview.applied).toBe(true);
    expect(replay.applied).toBe(false);
  });
});
