import { useAuthStore } from '@/store/authStore/authStore';
import type { CloudQuotaRequest, CloudQuotaUserIdentity } from '../types/cloudQuotaTypes';

export const getQuotaRequester = (request: CloudQuotaRequest): CloudQuotaUserIdentity | undefined =>
  request.requestedBy ?? request.owner ??
  (request.requestedByUserId || request.ownerUserId
    ? { userId: request.requestedByUserId ?? request.ownerUserId }
    : undefined);

export const getQuotaUserPrimary = (
  identity: CloudQuotaUserIdentity | undefined,
  fallback = 'Không xác định',
): string => {
  const currentAdmin = useAuthStore.getState().user;
  if (identity?.userId && currentAdmin?.id === identity.userId) {
    const account = currentAdmin.employeeCode?.trim() || currentAdmin.username?.trim() || currentAdmin.email?.trim();
    const name = currentAdmin.displayName?.trim() || currentAdmin.fullName?.trim();
    const localLabel = [account, name].filter(Boolean).join(' — ');
    if (localLabel) return localLabel;
  }

  return identity?.displayName?.trim() || identity?.username?.trim() || identity?.email?.trim() || fallback;
};

export const getQuotaUserSecondary = (identity: CloudQuotaUserIdentity | undefined): string | undefined => {
  const currentAdmin = useAuthStore.getState().user;
  if (identity?.userId && currentAdmin?.id === identity.userId) {
    const values = [currentAdmin.email?.trim(), `User ID: ${identity.userId}`].filter(
      (value): value is string => Boolean(value),
    );
    return values.length > 0 ? values.join(' · ') : undefined;
  }

  const values = [
    identity?.username?.trim() ? `@${identity.username.trim()}` : undefined,
    identity?.email?.trim(),
  ].filter((value): value is string => Boolean(value));

  return values.length > 0 ? values.join(' · ') : undefined;
};
