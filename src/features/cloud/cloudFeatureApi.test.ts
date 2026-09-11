import { afterEach, describe, expect, it, vi } from 'vitest';

const getObservability = vi.fn();
vi.mock('@/api/cloud', () => ({
  cloudClient: {},
  cloudOperationalClient: { getObservability },
}));

describe('Cloud API source', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('uses the real API in development when no mode is configured', async () => {
    vi.stubEnv('DEV', true);
    vi.stubEnv('VITE_CLOUD_API_MODE', undefined);
    const { cloudFeatureApi } = await import('./cloudFeatureApi');
    await cloudFeatureApi.observability.getSummary({});
    expect(getObservability).toHaveBeenCalledWith({});
  });
});
