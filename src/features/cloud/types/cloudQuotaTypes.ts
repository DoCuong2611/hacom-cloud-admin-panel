export type CloudQuotaRequestStatus = 'pending' | 'approved' | 'rejected';

export interface CloudQuotaUserIdentity {
  userId: string;
  username?: string | null;
  displayName?: string | null;
  email?: string | null;
}

export interface CloudQuotaRequest {
  id: string;
  ownerUserId: string;
  requestedByUserId?: string;
  owner?: CloudQuotaUserIdentity | null;
  requestedBy?: CloudQuotaUserIdentity | null;
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

export interface CloudQuotaRequestsPage {
  items: CloudQuotaRequest[];
  nextCursor: string | null;
}

export interface CloudQuotaListParams {
  status: CloudQuotaRequestStatus;
  limit: number;
  cursor?: string;
  signal?: AbortSignal;
}

export interface CloudQuotaReviewPayload {
  note?: string;
  idempotencyKey: string;
}

export interface CloudQuotaReviewApi {
  list: (params: CloudQuotaListParams) => Promise<CloudQuotaRequestsPage>;
  approve: (requestId: string, payload: CloudQuotaReviewPayload) => Promise<CloudQuotaRequest>;
  reject: (requestId: string, payload: CloudQuotaReviewPayload) => Promise<CloudQuotaRequest>;
}

export type CloudQuotaReviewAction = 'approve' | 'reject';
