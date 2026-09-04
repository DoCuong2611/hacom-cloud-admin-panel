import type {
  CloudAuditEvent,
  CloudDriveReadModel,
  CloudJob,
  CloudItemReadModel,
  CloudObservabilitySummary,
  CloudOverview,
  CloudTrashItem,
  CloudUserReadModel,
} from '../types/cloudOperationalTypes';

export const cloudOverviewFixture: CloudOverview = {
  generatedAt: '2026-08-27T08:00:00.000Z',
  activeDrives: 0,
  usedBytes: 0,
  reservedBytes: 0,
  trashBytes: 0,
  pendingQuotaRequests: 0,
  processingItems: 0,
  failedItems: 0,
  deadJobs: 0,
};

export const cloudObservabilityFixture: CloudObservabilitySummary = {
  generatedAt: '2026-08-27T08:00:00.000Z',
  freshness: 'unavailable',
  sources: {
    prometheus: 'unavailable',
    cloudApiMetrics: 'unavailable',
    cloudWorkerMetrics: 'unavailable',
    grafana: { status: 'unavailable' },
  },
  signals: {
    searchP95Ms: null,
    quotaRequestRatePerMinute: null,
    reviewErrorRatePerMinute: null,
    workerDeadJobsIncrease: null,
    workerRetryRatePerMinute: null,
  },
  warnings: [],
};

export const cloudUserFixture: CloudUserReadModel = {
  userId: 'user-fixture',
  status: 'active',
  driveCount: 0,
  quotaBytes: 0,
  usedBytes: 0,
  reservedBytes: 0,
  trashBytes: 0,
  itemCount: 0,
  lastActivityAt: '2026-08-27T08:00:00.000Z',
  createdAt: '2026-08-27T08:00:00.000Z',
  updatedAt: '2026-08-27T08:00:00.000Z',
};

export const cloudDriveFixture: CloudDriveReadModel = {
  driveId: 'drive-fixture',
  ownerUserId: 'user-fixture',
  status: 'active',
  quotaBytes: 0,
  usedBytes: 0,
  reservedBytes: 0,
  trashBytes: 0,
  itemCount: 0,
  lastActivityAt: '2026-08-27T08:00:00.000Z',
  createdAt: '2026-08-27T08:00:00.000Z',
  updatedAt: '2026-08-27T08:00:00.000Z',
};

export const cloudItemFixture: CloudItemReadModel = {
  itemId: 'item-fixture',
  driveId: 'drive-fixture',
  ownerUserId: 'user-fixture',
  type: 'file',
  status: 'active',
  sizeBytes: 0,
  createdAt: '2026-08-27T08:00:00.000Z',
  updatedAt: '2026-08-27T08:00:00.000Z',
  deletedAt: null,
  purgeAfter: null,
};

export const cloudTrashFixture: CloudTrashItem = {
  ...cloudItemFixture,
  status: 'deleted',
  deletedAt: '2026-08-27T08:00:00.000Z',
  purgeAfter: '2026-09-27T08:00:00.000Z',
};

export const cloudJobFixture: CloudJob = {
  jobId: 'job-fixture',
  type: 'metadata-index',
  status: 'queued',
  resourceType: 'item',
  resourceId: 'item-fixture',
  attempts: 0,
  maxAttempts: 3,
  createdAt: '2026-08-27T08:00:00.000Z',
  startedAt: null,
  finishedAt: null,
  nextRetryAt: null,
  lastErrorCode: null,
  updatedAt: '2026-08-27T08:00:00.000Z',
};

export const cloudAuditFixture: CloudAuditEvent = {
  auditId: 'audit-fixture',
  actorId: 'admin-fixture',
  action: 'cloud.read',
  resourceType: 'overview',
  resourceId: 'cloud',
  outcome: 'success',
  requestId: 'request-fixture',
  operationId: 'operation-fixture',
  createdAt: '2026-08-27T08:00:00.000Z',
  metadata: {},
};
