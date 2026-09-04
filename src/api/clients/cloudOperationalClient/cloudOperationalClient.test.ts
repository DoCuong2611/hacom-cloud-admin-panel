import { beforeEach, describe, expect, it, vi } from 'vitest';

const { adminAxiosInstanceMock } = vi.hoisted(() => ({
  adminAxiosInstanceMock: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('@/api/axios/axios', () => ({
  adminAxiosInstance: adminAxiosInstanceMock,
}));

import { cloudOperationalClient } from './cloudOperationalClient';

describe('cloudOperationalClient', () => {
  beforeEach(() => {
    adminAxiosInstanceMock.get.mockReset();
    adminAxiosInstanceMock.post.mockReset();
  });

  it('keeps operational query params bounded and forwards AbortSignal', async () => {
    const controller = new AbortController();
    adminAxiosInstanceMock.get.mockResolvedValueOnce({
      status: 200,
      headers: {},
      data: {
        success: true,
        data: { items: [], nextCursor: null },
      },
    });

    await expect(
      cloudOperationalClient.listUsers({
        q: 'alice',
        limit: 25,
        cursor: '',
        signal: controller.signal,
      }),
    ).resolves.toEqual({ items: [], nextCursor: null });

    expect(adminAxiosInstanceMock.get).toHaveBeenCalledWith('/cloud/users', {
      params: { q: 'alice', limit: 25 },
      signal: controller.signal,
    });
  });

  it('encodes lifecycle IDs and keeps idempotency headers on mutations', async () => {
    const key = 'cloud-admin-lifecycle-1';
    adminAxiosInstanceMock.post.mockResolvedValueOnce({
      status: 200,
      headers: {},
      data: {
        success: true,
        data: { itemId: 'item/1', applied: true },
      },
    });

    await expect(
      cloudOperationalClient.purgeItem('item/1', {
        reason: 'cleanup approved',
        idempotencyKey: key,
      }),
    ).resolves.toMatchObject({ itemId: 'item/1', applied: true });

    expect(adminAxiosInstanceMock.post).toHaveBeenCalledWith(
      '/cloud/items/item%2F1/purge',
      { reason: 'cleanup approved' },
      { headers: { 'Idempotency-Key': key } },
    );
  });

  it('preserves backend error code and request ID', async () => {
    adminAxiosInstanceMock.get.mockRejectedValueOnce({
      response: {
        status: 503,
        headers: { 'x-request-id': 'req-cloud-operational-1' },
        data: {
          success: false,
          error: { code: 'CLOUD_UNAVAILABLE', message: 'metrics unavailable' },
        },
      },
    });

    await expect(cloudOperationalClient.getObservability()).rejects.toMatchObject({
      status: 503,
      code: 'CLOUD_UNAVAILABLE',
      requestId: 'req-cloud-operational-1',
      message: 'metrics unavailable',
    });
  });
});
