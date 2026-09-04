import { CloudApiError } from '@/api/clients/cloudClient/cloudClient';

import {
  cloudAuditFixture,
  cloudDriveFixture,
  cloudItemFixture,
  cloudJobFixture,
  cloudObservabilityFixture,
  cloudOverviewFixture,
  cloudTrashFixture,
  cloudUserFixture,
} from './fixtures/cloudFeatureFixtures';
import type {
  CloudAuditApi,
  CloudAuditEvent,
  CloudAuditListParams,
  CloudCursorPage,
  CloudDriveListParams,
  CloudItemListParams,
  CloudJob,
  CloudJobListParams,
  CloudJobMutationPayload,
  CloudJobsApi,
  CloudLifecyclePayload,
  CloudObservabilityApi,
  CloudObservabilitySummary,
  CloudOverview,
  CloudReadModelsApi,
  CloudTrashApi,
  CloudTrashItem,
  CloudTrashListParams,
  CloudUserListParams,
} from './types/cloudOperationalTypes';
import type {
  CloudQuotaRequest,
  CloudQuotaRequestsPage,
  CloudQuotaListParams,
  CloudQuotaReviewApi,
  CloudQuotaReviewPayload,
} from './types/cloudQuotaTypes';

const fixtureUpdatedAt = '2026-08-27T08:00:00.000Z';
const fixtureNextCursor = 'fixture:next';

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const resolveFixture = <T>(value: T, signal?: AbortSignal): Promise<T> => {
  if (signal?.aborted) {
    return Promise.reject(new DOMException('The fixture request was aborted.', 'AbortError'));
  }

  return Promise.resolve(clone(value));
};

const paginate = <T,>(items: T[], limit: number, cursor?: string): CloudCursorPage<T> => {
  const offset = cursor === fixtureNextCursor ? limit : 0;
  const pageItems = items.slice(offset, offset + limit);

  return {
    items: clone(pageItems),
    nextCursor: offset + limit < items.length ? fixtureNextCursor : null,
  };
};

const matchesText = (value: string, query?: string): boolean =>
  !query || value.toLowerCase().includes(query.toLowerCase());

const cloudQuotaFixture: CloudQuotaRequest = {
  id: 'quota-request-fixture',
  ownerUserId: 'user-fixture',
  status: 'pending',
  currentQuotaBytes: 5_000_000_000,
  requestedQuotaBytes: 10_000_000_000,
  quotaBytes: 5_000_000_000,
  usedBytes: 0,
  reservedBytes: 0,
  trashBytes: 0,
  reason: 'Kiểm tra giao diện duyệt quota Cloud ở local.',
  createdAt: fixtureUpdatedAt,
  updatedAt: fixtureUpdatedAt,
};

let quotaRequests = [cloudQuotaFixture];
let trashItems = [cloudTrashFixture];
let jobs = [cloudJobFixture];
const appliedMutations = new Map<string, unknown>();

const ensureIdempotencyKey = (idempotencyKey: string): void => {
  if (!idempotencyKey.trim() || idempotencyKey.length > 128) {
    throw new CloudApiError({
      code: 'VALIDATION_ERROR',
      message: 'Idempotency-Key phải có từ 1 đến 128 ký tự.',
    });
  }
};

const findOrThrow = <T extends { id?: string; itemId?: string; jobId?: string }>(
  items: T[],
  id: string,
  kind: string,
): T => {
  const item = items.find((entry) => entry.id === id || entry.itemId === id || entry.jobId === id);
  if (!item) {
    throw new CloudApiError({
      status: 404,
      code: `${kind.toUpperCase()}_NOT_FOUND`,
      message: `${kind} không tồn tại trong dữ liệu mẫu.`,
    });
  }

  return item;
};

const fixtureQuotaApi: CloudQuotaReviewApi = {
  list: (params: CloudQuotaListParams): Promise<CloudQuotaRequestsPage> => {
    const items = quotaRequests.filter(
      (request) => !params.status || request.status === params.status,
    );
    return resolveFixture(paginate(items, params.limit, params.cursor), params.signal);
  },

  approve: (requestId: string, payload: CloudQuotaReviewPayload) => {
    ensureIdempotencyKey(payload.idempotencyKey);
    const mutationKey = `quota:${requestId}:${payload.idempotencyKey}`;
    const previousResult = appliedMutations.get(mutationKey) as CloudQuotaRequest | undefined;
    if (previousResult) {
      return resolveFixture({ ...previousResult, applied: false });
    }

    const request = findOrThrow(quotaRequests, requestId, 'quota request');
    const updated: CloudQuotaRequest = {
      ...request,
      status: 'approved',
      applied: true,
      reviewedByUserId: 'admin-fixture',
      reviewedAt: fixtureUpdatedAt,
      reviewNote: payload.note,
      updatedAt: fixtureUpdatedAt,
    };
    quotaRequests = quotaRequests.map((entry) => (entry.id === requestId ? updated : entry));
    appliedMutations.set(mutationKey, updated);
    return resolveFixture(updated);
  },

  reject: (requestId: string, payload: CloudQuotaReviewPayload) => {
    ensureIdempotencyKey(payload.idempotencyKey);
    const mutationKey = `quota:${requestId}:${payload.idempotencyKey}`;
    const previousResult = appliedMutations.get(mutationKey) as CloudQuotaRequest | undefined;
    if (previousResult) {
      return resolveFixture({ ...previousResult, applied: false });
    }

    const request = findOrThrow(quotaRequests, requestId, 'quota request');
    const updated: CloudQuotaRequest = {
      ...request,
      status: 'rejected',
      applied: true,
      reviewedByUserId: 'admin-fixture',
      reviewedAt: fixtureUpdatedAt,
      reviewNote: payload.note,
      updatedAt: fixtureUpdatedAt,
    };
    quotaRequests = quotaRequests.map((entry) => (entry.id === requestId ? updated : entry));
    appliedMutations.set(mutationKey, updated);
    return resolveFixture(updated);
  },
};

const fixtureObservabilityApi: CloudObservabilityApi = {
  getSummary: (params = {}) => resolveFixture<CloudObservabilitySummary>(cloudObservabilityFixture, params.signal),
};

const fixtureReadModelsApi: CloudReadModelsApi = {
  getOverview: (params = {}) => resolveFixture<CloudOverview>(cloudOverviewFixture, params.signal),

  listUsers: (params: CloudUserListParams) => {
    const items = [cloudUserFixture].filter(
      (user) => user.status === (params.status || user.status) && matchesText(user.userId, params.q),
    );
    return resolveFixture(paginate(items, params.limit, params.cursor), params.signal);
  },

  listDrives: (params: CloudDriveListParams) => {
    const items = [cloudDriveFixture].filter(
      (drive) =>
        (!params.ownerUserId || drive.ownerUserId === params.ownerUserId) &&
        (!params.status || drive.status === params.status),
    );
    return resolveFixture(paginate(items, params.limit, params.cursor), params.signal);
  },

  listItems: (params: CloudItemListParams) => {
    const items = [cloudItemFixture].filter(
      (item) =>
        (!params.driveId || item.driveId === params.driveId) &&
        (!params.ownerUserId || item.ownerUserId === params.ownerUserId) &&
        (!params.type || item.type === params.type) &&
        (!params.status || item.status === params.status),
    );
    return resolveFixture(paginate(items, params.limit, params.cursor), params.signal);
  },
};

const fixtureTrashApi: CloudTrashApi = {
  list: (params: CloudTrashListParams) => {
    const items = trashItems.filter(
      (item) =>
        (!params.driveId || item.driveId === params.driveId) &&
        (!params.ownerUserId || item.ownerUserId === params.ownerUserId) &&
        (!params.type || item.type === params.type),
    );
    return resolveFixture(paginate(items, params.limit, params.cursor), params.signal);
  },

  restore: (itemId: string, payload: CloudLifecyclePayload) => {
    ensureIdempotencyKey(payload.idempotencyKey);
    const mutationKey = `trash:restore:${itemId}:${payload.idempotencyKey}`;
    const previousResult = appliedMutations.get(mutationKey) as CloudTrashItem | undefined;
    if (previousResult) {
      return resolveFixture({ ...previousResult, applied: false });
    }

    const item = findOrThrow(trashItems, itemId, 'trash item');
    const updated: CloudTrashItem = { ...item, status: 'active', applied: true };
    trashItems = trashItems.filter((entry) => entry.itemId !== itemId);
    appliedMutations.set(mutationKey, updated);
    return resolveFixture(updated);
  },

  purge: (itemId: string, payload: CloudLifecyclePayload) => {
    ensureIdempotencyKey(payload.idempotencyKey);
    const mutationKey = `trash:purge:${itemId}:${payload.idempotencyKey}`;
    const previousResult = appliedMutations.get(mutationKey) as CloudTrashItem | undefined;
    if (previousResult) {
      return resolveFixture({ ...previousResult, applied: false });
    }

    const item = findOrThrow(trashItems, itemId, 'trash item');
    const updated: CloudTrashItem = { ...item, applied: true };
    trashItems = trashItems.filter((entry) => entry.itemId !== itemId);
    appliedMutations.set(mutationKey, updated);
    return resolveFixture(updated);
  },
};

const fixtureJobsApi: CloudJobsApi = {
  list: (params: CloudJobListParams) => {
    const items = jobs.filter(
      (job) =>
        (!params.status || job.status === params.status) &&
        (!params.type || job.type === params.type) &&
        (!params.resourceType || job.resourceType === params.resourceType),
    );
    return resolveFixture(paginate(items, params.limit, params.cursor), params.signal);
  },

  get: (jobId: string, params = {}) => resolveFixture(findOrThrow(jobs, jobId, 'job'), params.signal),

  retry: (jobId: string, payload: CloudJobMutationPayload) => {
    ensureIdempotencyKey(payload.idempotencyKey);
    const job = findOrThrow(jobs, jobId, 'job');
    const updated: CloudJob = { ...job, status: 'queued', applied: true, updatedAt: fixtureUpdatedAt };
    jobs = jobs.map((entry) => (entry.jobId === jobId ? updated : entry));
    return resolveFixture(updated);
  },

  cancel: (jobId: string, payload: CloudJobMutationPayload) => {
    ensureIdempotencyKey(payload.idempotencyKey);
    const job = findOrThrow(jobs, jobId, 'job');
    const updated: CloudJob = { ...job, status: 'cancelled', applied: true, updatedAt: fixtureUpdatedAt };
    jobs = jobs.map((entry) => (entry.jobId === jobId ? updated : entry));
    return resolveFixture(updated);
  },
};

const fixtureAuditApi: CloudAuditApi = {
  list: (params: CloudAuditListParams) => {
    const items = [cloudAuditFixture].filter(
      (event: CloudAuditEvent) =>
        (!params.actorId || event.actorId === params.actorId) &&
        (!params.action || event.action === params.action) &&
        (!params.resourceType || event.resourceType === params.resourceType) &&
        (!params.outcome || event.outcome === params.outcome),
    );
    return resolveFixture(paginate(items, params.limit, params.cursor), params.signal);
  },
};

export const cloudFixtureApi = {
  quota: fixtureQuotaApi,
  observability: fixtureObservabilityApi,
  readModels: fixtureReadModelsApi,
  trash: fixtureTrashApi,
  jobs: fixtureJobsApi,
  audit: fixtureAuditApi,
};
