import type { AccessStatus } from '@/api/types/access/access';
import type { LoginResponse } from '@/api/types/auth/auth';

/** Local-only UI demo auth. It is disabled automatically in production builds. */
export const isLocalDemoAuthEnabled =
  import.meta.env.DEV && import.meta.env.VITE_LOCAL_DEMO_AUTH === 'true';

export const localDemoLoginResponse: LoginResponse = {
  accessToken: 'local-demo-access-token',
  user: {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'cloud-admin@local.test',
    displayName: 'Cloud Demo Admin',
    role: 'super_admin',
    permissions: ['admin.cloud.read', 'admin.cloud.quota.review', 'admin.cloud.observability.read'],
    status: 'active',
  },
};

export const localDemoAccessStatus: AccessStatus = {
  scope: 'admin',
  ipAddress: '127.0.0.1',
  normalizedIp: '127.0.0.1',
  status: 'approved',
  firstSeenAt: null,
  lastSeenAt: null,
  expiresAt: null,
  note: 'Local UI demo mode',
  reason: null,
  requestExists: false,
  pollAfterMs: 60000,
  canResubmit: false,
  source: 'auto_detected',
};
