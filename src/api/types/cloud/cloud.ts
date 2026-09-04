export type CloudQuotaRequestStatus = 'pending' | 'approved' | 'rejected';

export interface CloudQuotaRequest {
  id: string;
  ownerUserId: string;
  status: CloudQuotaRequestStatus;
  currentQuotaBytes: number;
  requestedQuotaBytes: number;
  quotaBytes: number;
  usedBytes: number;
  reservedBytes: number;
  trashBytes: number;
  reason?: string;
  reviewedByUserId?: string;
  reviewedAt?: string;
  reviewNote?: string;
  createdAt: string;
  updatedAt: string;
  applied?: boolean;
}

export interface CloudQuotaRequestListParams {
  status?: CloudQuotaRequestStatus;
  limit?: number;
  cursor?: string;
  signal?: AbortSignal;
}

export interface CloudQuotaRequestListResponse {
  items: CloudQuotaRequest[];
  nextCursor: string | null;
}

export interface CloudQuotaReviewParams {
  requestId: string;
  decision: 'approve' | 'reject';
  note?: string;
  /** Keep this value unchanged when retrying the same mutation intent. */
  idempotencyKey: string;
}

export type CloudQuotaReviewResponse = CloudQuotaRequest;

export type CloudFreshness = 'live' | 'partial' | 'unavailable';
export type CloudSourceStatus = 'available' | 'degraded' | 'unavailable';

export interface CloudGrafanaSource {
  status: CloudSourceStatus;
  url?: string;
  isPubliclyAccessible?: boolean;
}

export interface CloudObservabilitySummary {
  generatedAt: string;
  freshness: CloudFreshness;
  sources: {
    prometheus: CloudSourceStatus;
    cloudApiMetrics: CloudSourceStatus;
    cloudWorkerMetrics: CloudSourceStatus;
    grafana: CloudGrafanaSource;
  };
  signals: {
    searchP95Ms: number | null;
    quotaRequestRatePerMinute: number | null;
    reviewErrorRatePerMinute: number | null;
    workerDeadJobsIncrease: number | null;
    workerRetryRatePerMinute: number | null;
  };
  warnings: string[];
}

export interface CloudOverview {
  generatedAt: string;
  activeDrives: number;
  usedBytes: number;
  reservedBytes: number;
  trashBytes: number;
  pendingQuotaRequests: number;
  processingItems: number;
  failedItems: number;
  deadJobs: number;
}

export interface CloudUserReadModel {
  userId: string;
  status: string;
  driveCount: number;
  quotaBytes: number;
  usedBytes: number;
  reservedBytes: number;
  trashBytes: number;
  itemCount: number;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CloudDriveReadModel {
  driveId: string;
  ownerUserId: string;
  status: string;
  quotaBytes: number;
  usedBytes: number;
  reservedBytes: number;
  trashBytes: number;
  itemCount: number;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CloudItemReadModel {
  itemId: string;
  driveId: string;
  ownerUserId: string;
  type: string;
  status: string;
  sizeBytes: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  purgeAfter?: string | null;
}

export interface CloudCursorPage<T> {
  items: T[];
  nextCursor: string | null;
}

export interface CloudUserListParams {
  status?: string;
  q?: string;
  sortBy?: 'usedBytes' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  limit: number;
  cursor?: string;
  signal?: AbortSignal;
}

export interface CloudDriveListParams {
  ownerUserId?: string;
  status?: string;
  sortBy?: 'usedBytes' | 'updatedAt' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  limit: number;
  cursor?: string;
  signal?: AbortSignal;
}

export interface CloudItemListParams {
  driveId?: string;
  ownerUserId?: string;
  type?: string;
  status?: string;
  sortBy?: 'sizeBytes' | 'updatedAt' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  limit: number;
  cursor?: string;
  signal?: AbortSignal;
}

export interface CloudTrashListParams {
  driveId?: string;
  ownerUserId?: string;
  type?: string;
  sortBy?: 'deletedAt' | 'purgeAfter' | 'sizeBytes';
  sortOrder?: 'asc' | 'desc';
  limit: number;
  cursor?: string;
  signal?: AbortSignal;
}

export interface CloudTrashItem extends CloudItemReadModel {
  deletedAt: string;
  purgeAfter: string;
  applied?: boolean;
}

export interface CloudLifecyclePayload {
  reason: string;
  idempotencyKey: string;
}

export type CloudJobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'dead' | 'cancelled';

export interface CloudJob {
  jobId: string;
  type: string;
  status: CloudJobStatus;
  resourceType: string;
  resourceId: string;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  startedAt?: string | null;
  finishedAt?: string | null;
  nextRetryAt?: string | null;
  lastErrorCode?: string | null;
  updatedAt?: string | null;
  applied?: boolean;
}

export interface CloudJobListParams {
  status?: CloudJobStatus;
  type?: string;
  resourceType?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'nextRetryAt';
  sortOrder?: 'asc' | 'desc';
  limit: number;
  cursor?: string;
  signal?: AbortSignal;
}

export interface CloudJobMutationPayload {
  idempotencyKey: string;
}

export interface CloudAuditEvent {
  auditId: string;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  outcome: string;
  requestId: string;
  operationId: string;
  createdAt: string;
  metadata: Record<string, unknown>;
}

export interface CloudAuditListParams {
  actorId?: string;
  action?: string;
  resourceType?: string;
  outcome?: string;
  from?: string;
  to?: string;
  sortOrder?: 'asc' | 'desc';
  limit: number;
  cursor?: string;
  signal?: AbortSignal;
}
