import { cloudClient, cloudOperationalClient } from '@/api/cloud';

import { cloudFixtureApi } from './cloudFixtureApi';
import type {
  CloudAuditApi,
  CloudJobsApi,
  CloudObservabilityApi,
  CloudReadModelsApi,
  CloudTrashApi,
} from '@/features/cloud/types/cloudOperationalTypes';
import type {
  CloudQuotaListParams,
  CloudQuotaReviewApi,
  CloudQuotaReviewPayload,
  CloudQuotaRequestsPage,
  CloudQuotaRequest,
} from '@/features/cloud/types/cloudQuotaTypes';

const liveCloudFeatureApi: {
  quota: CloudQuotaReviewApi;
  observability: CloudObservabilityApi;
  readModels: CloudReadModelsApi;
  trash: CloudTrashApi;
  jobs: CloudJobsApi;
  audit: CloudAuditApi;
} = {
  quota: {
    list: async (params: CloudQuotaListParams): Promise<CloudQuotaRequestsPage> =>
      cloudClient.listQuotaRequests(params),
    approve: async (requestId: string, payload: CloudQuotaReviewPayload): Promise<CloudQuotaRequest> =>
      cloudClient.reviewQuotaRequest({
        requestId,
        decision: 'approve',
        note: payload.note,
        idempotencyKey: payload.idempotencyKey,
      }),
    reject: async (requestId: string, payload: CloudQuotaReviewPayload): Promise<CloudQuotaRequest> =>
      cloudClient.reviewQuotaRequest({
        requestId,
        decision: 'reject',
        note: payload.note,
        idempotencyKey: payload.idempotencyKey,
      }),
  },
  observability: {
    getSummary: (params) => cloudOperationalClient.getObservability(params),
  },
  readModels: {
    getOverview: (params) => cloudOperationalClient.getOverview(params),
    listUsers: (params) => cloudOperationalClient.listUsers(params),
    listDrives: (params) => cloudOperationalClient.listDrives(params),
    listItems: (params) => cloudOperationalClient.listItems(params),
  },
  trash: {
    list: (params) => cloudOperationalClient.listTrash(params),
    restore: (itemId, payload) => cloudOperationalClient.restoreItem(itemId, payload),
    purge: (itemId, payload) => cloudOperationalClient.purgeItem(itemId, payload),
  },
  jobs: {
    list: (params) => cloudOperationalClient.listJobs(params),
    get: (jobId, params) => cloudOperationalClient.getJob(jobId, params),
    retry: (jobId, payload) => cloudOperationalClient.retryJob(jobId, payload),
    cancel: (jobId, payload) => cloudOperationalClient.cancelJob(jobId, payload),
  },
  audit: {
    list: (params) => cloudOperationalClient.listAudit(params),
  },
};

const cloudApiMode =
  import.meta.env.VITE_CLOUD_API_MODE?.trim().toLowerCase() ??
  (import.meta.env.DEV ? 'fixture' : 'live');

/**
 * Fixture mode is opt-in for local UI checks while the Cloud service API is unavailable.
 * Staging and production use the live hacom-cloud-service API by default.
 */
export const cloudFeatureApi = cloudApiMode === 'fixture' ? cloudFixtureApi : liveCloudFeatureApi;
