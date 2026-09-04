import type { AxiosError, AxiosResponse } from 'axios';

import { adminAxiosInstance } from '@/api/axios/axios';
import type { ApiEnvelope } from '@/api/envelope/envelope';
import { unwrapApiEnvelope } from '@/api/envelope/envelope';
import { CloudApiError } from '@/api/clients/cloudClient/cloudClient';
import type {
  CloudAuditEvent,
  CloudAuditListParams,
  CloudCursorPage,
  CloudDriveListParams,
  CloudDriveReadModel,
  CloudItemListParams,
  CloudItemReadModel,
  CloudJob,
  CloudJobListParams,
  CloudJobMutationPayload,
  CloudLifecyclePayload,
  CloudObservabilitySummary,
  CloudOverview,
  CloudTrashItem,
  CloudTrashListParams,
  CloudUserListParams,
  CloudUserReadModel,
} from '@/api/types/cloud/cloud';

const readRecord = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : undefined;

const readString = (value: unknown): string | undefined =>
  typeof value === 'string' && value ? value : undefined;

const requestIdFromResponse = (response: AxiosResponse<ApiEnvelope<unknown>>): string | undefined => {
  const payload = readRecord(response.data);
  const meta = readRecord(payload?.meta);
  return (
    readString(meta?.requestId) ??
    readString(response.headers?.['x-request-id']) ??
    readString(response.headers?.['X-Request-ID'])
  );
};

const toCloudApiError = (error: unknown): CloudApiError => {
  if (error instanceof CloudApiError) return error;

  const axiosError = error as AxiosError<ApiEnvelope<unknown>>;
  const response = axiosError.response;
  const responseData = readRecord(response?.data);
  const responseError = readRecord(responseData?.error);
  const status = response?.status;

  return new CloudApiError({
    status,
    requestId: response ? requestIdFromResponse(response) : undefined,
    retryAfter: readString(response?.headers?.['retry-after']),
    code:
      readString(responseError?.code) ??
      (status === 401 || status === 403
        ? 'FORBIDDEN'
        : status === 404
          ? 'CLOUD_RESOURCE_NOT_FOUND'
          : status === 409
            ? 'CLOUD_CONFLICT'
            : status === 429
              ? 'RATE_LIMITED'
              : status && status >= 500
                ? 'CLOUD_UNAVAILABLE'
                : 'CLOUD_REQUEST_FAILED'),
    message:
      readString(responseError?.message) ??
      (error instanceof Error ? error.message : 'Cloud request failed'),
  });
};

const unwrapResponse = <T>(response: AxiosResponse<ApiEnvelope<T>>): T => {
  const payload = readRecord(response.data);
  const responseError = readRecord(payload?.error);

  if (responseError) {
    throw new CloudApiError({
      status: response.status,
      code: readString(responseError.code) ?? 'CLOUD_REQUEST_FAILED',
      message: readString(responseError.message) ?? 'Cloud request failed',
      requestId: requestIdFromResponse(response),
    });
  }

  return unwrapApiEnvelope<T>(response);
};

const compactParams = (params: object) =>
  Object.fromEntries(
    Object.entries(params).filter(
      ([key, value]) => key !== 'signal' && value !== undefined && value !== '',
    ),
  );

const getResource = async <T>(path: string, params: object, signal?: AbortSignal): Promise<T> => {
  try {
    const response = await adminAxiosInstance.get<ApiEnvelope<T>>(path, {
      params: compactParams(params),
      ...(signal ? { signal } : {}),
    });
    return unwrapResponse(response);
  } catch (error) {
    throw toCloudApiError(error);
  }
};

const postMutation = async <T>(
  path: string,
  body: object,
  idempotencyKey: string,
): Promise<T> => {
  if (!idempotencyKey.trim() || idempotencyKey.length > 128) {
    throw new CloudApiError({
      code: 'VALIDATION_ERROR',
      message: 'Idempotency-Key must contain 1 to 128 characters',
    });
  }

  try {
    const response = await adminAxiosInstance.post<ApiEnvelope<T>>(path, body, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
    return unwrapResponse(response);
  } catch (error) {
    throw toCloudApiError(error);
  }
};

export const cloudOperationalClient = {
  getObservability: (params: { signal?: AbortSignal } = {}) =>
    getResource<CloudObservabilitySummary>('/cloud/observability', {}, params.signal),

  getOverview: (params: { signal?: AbortSignal } = {}) =>
    getResource<CloudOverview>('/cloud/overview', {}, params.signal),

  listUsers: (params: CloudUserListParams) =>
    getResource<CloudCursorPage<CloudUserReadModel>>('/cloud/users', params, params.signal),

  listDrives: (params: CloudDriveListParams) =>
    getResource<CloudCursorPage<CloudDriveReadModel>>('/cloud/drives', params, params.signal),

  listItems: (params: CloudItemListParams) =>
    getResource<CloudCursorPage<CloudItemReadModel>>('/cloud/items', params, params.signal),

  listTrash: (params: CloudTrashListParams) =>
    getResource<CloudCursorPage<CloudTrashItem>>('/cloud/trash', params, params.signal),

  restoreItem: (itemId: string, payload: CloudLifecyclePayload) =>
    postMutation<CloudTrashItem>(
      `/cloud/items/${encodeURIComponent(itemId)}/restore`,
      { reason: payload.reason },
      payload.idempotencyKey,
    ),

  purgeItem: (itemId: string, payload: CloudLifecyclePayload) =>
    postMutation<CloudTrashItem>(
      `/cloud/items/${encodeURIComponent(itemId)}/purge`,
      { reason: payload.reason },
      payload.idempotencyKey,
    ),

  listJobs: (params: CloudJobListParams) =>
    getResource<CloudCursorPage<CloudJob>>('/cloud/jobs', params, params.signal),

  getJob: (jobId: string, params: { signal?: AbortSignal } = {}) =>
    getResource<CloudJob>(`/cloud/jobs/${encodeURIComponent(jobId)}`, {}, params.signal),

  retryJob: (jobId: string, payload: CloudJobMutationPayload) =>
    postMutation<CloudJob>(
      `/cloud/jobs/${encodeURIComponent(jobId)}/retry`,
      {},
      payload.idempotencyKey,
    ),

  cancelJob: (jobId: string, payload: CloudJobMutationPayload) =>
    postMutation<CloudJob>(
      `/cloud/jobs/${encodeURIComponent(jobId)}/cancel`,
      {},
      payload.idempotencyKey,
    ),

  listAudit: (params: CloudAuditListParams) =>
    getResource<CloudCursorPage<CloudAuditEvent>>('/cloud/audit', params, params.signal),
};
