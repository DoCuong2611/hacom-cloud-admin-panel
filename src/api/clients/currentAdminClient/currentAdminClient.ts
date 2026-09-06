import { authAxiosInstance } from '@/api/axios/axios';
import type { ApiRequestConfig } from '@/api/axios/axios';
import { unwrapApiEnvelope } from '@/api/envelope/envelope';
import type { CurrentAdmin, MeResponseWithConfig } from '@/api/types/auth/auth';

export const currentAdminClient = {
  async getCurrentAdmin(config?: ApiRequestConfig): Promise<CurrentAdmin> {
    const response = await authAxiosInstance.get('/me', config);
    return unwrapApiEnvelope<CurrentAdmin>(response);
  },

  async getCurrentAdminWithConfig(
    config?: ApiRequestConfig,
  ): Promise<MeResponseWithConfig> {
    const response = await authAxiosInstance.get('/me', config);
    const admin = unwrapApiEnvelope<CurrentAdmin>(response);
    return {
      admin,
      config: {
        environment: 'unknown',
        allowlistConfigured: false,
        ipApprovalEnabled: false,
        writeActionsEnabled: false,
      },
    };
  },
};
