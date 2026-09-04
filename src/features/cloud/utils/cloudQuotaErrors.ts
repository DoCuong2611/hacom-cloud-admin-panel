import { isAxiosError } from 'axios';

import { getApiErrorCode, getApiErrorStatus } from '@/api/error/error';

export type CloudQuotaErrorKind =
  | 'pending-access'
  | 'rejected-access'
  | 'source-mismatch'
  | 'forbidden'
  | 'rate-limited'
  | 'not-found'
  | 'upstream'
  | 'generic';

export interface CloudQuotaErrorInfo {
  kind: CloudQuotaErrorKind;
  status?: number;
  code?: string;
  message: string;
  requestId?: string;
}

interface ErrorRecord {
  code?: unknown;
  message?: unknown;
  error?: ErrorRecord;
  meta?: Record<string, unknown>;
  status?: unknown;
  requestId?: unknown;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object';

const readRecord = (value: unknown): ErrorRecord => (isRecord(value) ? value : {});

const readString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value : undefined;

const readResponseData = (error: unknown): ErrorRecord => {
  if (isAxiosError(error)) {
    return readRecord(error.response?.data);
  }

  return readRecord(error);
};

const resolveKind = (status: number | undefined, code: string | undefined): CloudQuotaErrorKind => {
  if (code === 'ACCESS_IP_PENDING' || code === 'ADMIN_ACCESS_IP_NOT_APPROVED') {
    return 'pending-access';
  }

  if (code === 'ACCESS_IP_REJECTED') {
    return 'rejected-access';
  }

  if (code === 'SOURCE_IP_MISMATCH' || code === 'CLIENT_IP_UNRESOLVED') {
    return 'source-mismatch';
  }

  if (status === 403 || code === 'FORBIDDEN' || code === 'RBAC_PERMISSION_DENIED') {
    return 'forbidden';
  }

  if (status === 429) {
    return 'rate-limited';
  }

  if (status === 404 || code === 'QUOTA_REQUEST_NOT_FOUND') {
    return 'not-found';
  }

  if (status !== undefined && status >= 502) {
    return 'upstream';
  }

  return 'generic';
};

export const getCloudQuotaErrorInfo = (error: unknown): CloudQuotaErrorInfo => {
  const body = readResponseData(error);
  const nestedError = readRecord(body.error);
  const errorRecord = readRecord(error);
  const status = getApiErrorStatus(error) ?? (typeof errorRecord.status === 'number' ? errorRecord.status : undefined);
  const code = getApiErrorCode(error) ?? readString(nestedError.code) ?? readString(body.code) ?? readString(errorRecord.code);
  const requestId = readString(body.meta?.requestId) ?? readString(errorRecord.requestId);
  const message =
    readString(nestedError.message) ??
    readString(body.message) ??
    (error instanceof Error && error.message ? error.message : 'Không thể hoàn tất yêu cầu Cloud.');

  return {
    kind: resolveKind(status, code),
    status,
    code,
    message,
    requestId,
  };
};

export const getCloudQuotaErrorTitle = (kind: CloudQuotaErrorKind): string => {
  switch (kind) {
    case 'pending-access':
      return 'Quyền truy cập đang chờ duyệt';
    case 'rejected-access':
      return 'Quyền truy cập đã bị từ chối';
    case 'source-mismatch':
      return 'Nguồn truy cập không khớp';
    case 'forbidden':
      return 'Bạn không có quyền xem quota request';
    case 'rate-limited':
      return 'Đang bị giới hạn tần suất';
    case 'not-found':
      return 'Không tìm thấy quota request';
    case 'upstream':
      return 'Dịch vụ Cloud đang không khả dụng';
    default:
      return 'Không thể tải dữ liệu quota';
  }
};

export const getCloudQuotaErrorType = (kind: CloudQuotaErrorKind): 'error' | 'warning' | 'info' => {
  if (kind === 'pending-access' || kind === 'rate-limited') {
    return 'warning';
  }

  if (kind === 'rejected-access' || kind === 'source-mismatch' || kind === 'forbidden') {
    return 'info';
  }

  return 'error';
};

export const getCloudQuotaErrorRequestId = (error: unknown): string | undefined => {
  const info = getCloudQuotaErrorInfo(error);

  if (info.requestId) {
    return info.requestId;
  }

  if (!isAxiosError(error)) {
    return readString(readRecord(error).requestId);
  }

  return readString(error.response?.headers?.['x-request-id']);
};
