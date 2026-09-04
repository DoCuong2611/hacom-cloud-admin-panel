import { lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import { RequireApprovedAccess } from '@/app/guards/RequireApprovedAccess/RequireApprovedAccess';
import { RequireAuth } from '@/app/guards/RequireAuth/RequireAuth';
import { AppLayout } from '@/app/layout/AppLayout/AppLayout';
import { QueryStateView } from '@/components/QueryStates/QueryStates';
import { cloudFeatureApi } from '@/features/cloud/cloudFeatureApi';

const LoginPage = lazy(() =>
  import('@/features/auth/pages/LoginPage/LoginPage').then((module) => ({ default: module.LoginPage })),
);
const UsersPage = lazy(() =>
  import('@/features/users/pages/UsersPage/UsersPage').then((module) => ({ default: module.UsersPage })),
);
const UserDetailPage = lazy(() =>
  import('@/features/users/pages/UserDetailPage/UserDetailPage').then((module) => ({
    default: module.UserDetailPage,
  })),
);
const UserActivityPage = lazy(() =>
  import('@/features/users/pages/UserActivityPage/UserActivityPage').then((module) => ({
    default: module.UserActivityPage,
  })),
);
const AuditLogPage = lazy(() =>
  import('@/features/audit/pages/AuditLogPage/AuditLogPage').then((module) => ({
    default: module.AuditLogPage,
  })),
);
const SupportIssuesPage = lazy(() =>
  import('@/features/support/pages/SupportIssuesPage/SupportIssuesPage').then((module) => ({
    default: module.SupportIssuesPage,
  })),
);
const SystemLogsPage = lazy(() =>
  import('@/features/system-logs/pages/SystemLogsPage/SystemLogsPage').then((module) => ({
    default: module.SystemLogsPage,
  })),
);
const ServicesPage = lazy(() =>
  import('@/features/services/pages/ServicesPage/ServicesPage').then((module) => ({
    default: module.ServicesPage,
  })),
);
const SettingsPage = lazy(() =>
  import('@/features/settings/pages/SettingsPage/SettingsPage').then((module) => ({
    default: module.SettingsPage,
  })),
);
const MonitoringOverviewPage = lazy(() =>
  import('@/features/monitoring/pages/MonitoringOverviewPage/MonitoringOverviewPage').then((module) => ({
    default: module.MonitoringOverviewPage,
  })),
);
const AccessPendingPage = lazy(() =>
  import('@/features/access/pages/AccessPendingPage/AccessPendingPage').then((module) => ({
    default: module.AccessPendingPage,
  })),
);
const ProfilePage = lazy(() =>
  import('@/features/profile/pages/ProfilePage/ProfilePage').then((module) => ({
    default: module.ProfilePage,
  })),
);
const NotFoundPage = lazy(() =>
  import('@/features/errors/NotFoundPage/NotFoundPage').then((module) => ({
    default: module.NotFoundPage,
  })),
);
// Realtime pages
const RealtimeDashboardPage = lazy(() =>
  import('@/features/realtime/pages/RealtimeDashboard/RealtimeDashboard').then((module) => ({
    default: module.RealtimeDashboardPage,
  })),
);
const OnlineUsersPage = lazy(() =>
  import('@/features/realtime/pages/OnlineUsersPage/OnlineUsersPage').then((module) => ({
    default: module.OnlineUsersPage,
  })),
);
const TrafficPage = lazy(() =>
  import('@/features/realtime/pages/TrafficPage/TrafficPage').then((module) => ({
    default: module.TrafficPage,
  })),
);
// Alerts page
const AlertsPage = lazy(() =>
  import('@/features/alerts/pages/AlertsPage/AlertsPage').then((module) => ({
    default: module.AlertsPage,
  })),
);

const CloudObservabilityPage = lazy(() =>
  import('@/features/cloud/pages/CloudObservabilityPage/CloudObservabilityPage').then((module) => ({
    default: module.CloudObservabilityPage,
  })),
);
const CloudOverviewPage = lazy(() =>
  import('@/features/cloud/pages/CloudReadModelsPage/CloudReadModelsPage').then((module) => ({
    default: module.CloudOverviewPage,
  })),
);
const CloudUsersPage = lazy(() =>
  import('@/features/cloud/pages/CloudReadModelsPage/CloudReadModelsPage').then((module) => ({
    default: module.CloudUsersPage,
  })),
);
const CloudDrivesPage = lazy(() =>
  import('@/features/cloud/pages/CloudReadModelsPage/CloudReadModelsPage').then((module) => ({
    default: module.CloudDrivesPage,
  })),
);
const CloudItemsPage = lazy(() =>
  import('@/features/cloud/pages/CloudReadModelsPage/CloudReadModelsPage').then((module) => ({
    default: module.CloudItemsPage,
  })),
);
const CloudQuotaRequestsPage = lazy(() =>
  import('@/features/cloud/pages/CloudQuotaRequestsPage/CloudQuotaRequestsPage').then((module) => ({
    default: module.CloudQuotaRequestsPage,
  })),
);
const CloudTrashPage = lazy(() =>
  import('@/features/cloud/pages/CloudTrashPage/CloudTrashPage').then((module) => ({
    default: module.CloudTrashPage,
  })),
);
const CloudJobsPage = lazy(() =>
  import('@/features/cloud/pages/CloudJobsPage/CloudJobsPage').then((module) => ({
    default: module.CloudJobsPage,
  })),
);
const CloudAuditPage = lazy(() =>
  import('@/features/cloud/pages/CloudAuditPage/CloudAuditPage').then((module) => ({
    default: module.CloudAuditPage,
  })),
);
const withSuspense = (element: ReactNode) => (
  <Suspense fallback={<QueryStateView kind="loading" title="Đang tải trang..." />}>
    {element}
  </Suspense>
);

const routes = [
  {
    path: '/login',
    element: withSuspense(<LoginPage />),
  },
  {
    path: '/access',
    element: (
      <RequireAuth>
        {withSuspense(<AccessPendingPage />)}
      </RequireAuth>
    ),
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <RequireApprovedAccess>
          <AppLayout />
        </RequireApprovedAccess>
      </RequireAuth>
    ),
    children: [
      {
        index: true,
        element: withSuspense(<MonitoringOverviewPage />),
      },
      {
        path: 'cloud',
        element: <Navigate to="/cloud/overview" replace />,
      },
      {
        path: 'cloud/overview',
        element: withSuspense(<CloudOverviewPage api={cloudFeatureApi.readModels} />),
      },
      {
        path: 'cloud/observability',
        element: withSuspense(<CloudObservabilityPage api={cloudFeatureApi.observability} />),
      },
      {
        path: 'cloud/quota-requests',
        element: withSuspense(<CloudQuotaRequestsPage api={cloudFeatureApi.quota} />),
      },
      {
        path: 'cloud/users',
        element: withSuspense(<CloudUsersPage api={cloudFeatureApi.readModels} />),
      },
      {
        path: 'cloud/drives',
        element: withSuspense(<CloudDrivesPage api={cloudFeatureApi.readModels} />),
      },
      {
        path: 'cloud/items',
        element: withSuspense(<CloudItemsPage api={cloudFeatureApi.readModels} />),
      },
      {
        path: 'cloud/trash',
        element: withSuspense(<CloudTrashPage api={cloudFeatureApi.trash} />),
      },
      {
        path: 'cloud/jobs',
        element: withSuspense(<CloudJobsPage api={cloudFeatureApi.jobs} />),
      },
      {
        path: 'cloud/audit',
        element: withSuspense(<CloudAuditPage api={cloudFeatureApi.audit} />),
      },
      {
        path: 'realtime',
        element: <Navigate to="/realtime/dashboard" replace />,
      },
      {
        path: 'realtime/dashboard',
        element: withSuspense(<RealtimeDashboardPage />),
      },
      {
        path: 'realtime/online-users',
        element: withSuspense(<OnlineUsersPage />),
      },
      {
        path: 'realtime/traffic',
        element: withSuspense(<TrafficPage />),
      },
      {
        path: 'alerts',
        element: withSuspense(<AlertsPage />),
      },
      {
        path: 'services',
        element: <Navigate to="/services/health" replace />,
      },
      {
        path: 'services/health',
        element: withSuspense(<ServicesPage />),
      },
      {
        path: 'services/smtp',
        element: withSuspense(<NotFoundPage />),
      },
      {
        path: 'services/email-templates',
        element: withSuspense(<NotFoundPage />),
      },
      {
        path: 'settings',
        element: <Navigate to="/settings/system" replace />,
      },
      {
        path: 'settings/:section',
        element: withSuspense(<SettingsPage />),
      },
      {
        path: 'monitoring',
        element: withSuspense(<MonitoringOverviewPage />),
      },
      {
        path: 'support-issues',
        element: withSuspense(<SupportIssuesPage />),
      },
      {
        path: 'logs',
        element: withSuspense(<SystemLogsPage />),
      },
      {
        path: 'users',
        element: withSuspense(<UsersPage />),
      },
      {
        path: 'users/activity',
        element: withSuspense(<UserActivityPage />),
      },
      {
        path: 'authority',
        element: withSuspense(<NotFoundPage />),
      },
      {
        path: 'users/:id',
        element: withSuspense(<UserDetailPage />),
      },
      {
        path: 'hr-employees',
        element: withSuspense(<NotFoundPage />),
      },
      {
        path: 'audit',
        element: withSuspense(<AuditLogPage />),
      },
      {
        path: 'access-requests',
        element: withSuspense(<NotFoundPage />),
      },
      {
        path: 'profile',
        element: withSuspense(<ProfilePage />),
      },
      {
        path: 'backup-restore',
        element: withSuspense(<NotFoundPage />),
      },
      {
        path: '*',
        element: withSuspense(<NotFoundPage />),
      },
    ],
  },
];

const rawBaseName = import.meta.env.BASE_URL || '/';
const baseName =
  rawBaseName.endsWith('/') && rawBaseName !== '/' ? rawBaseName.slice(0, -1) : rawBaseName;

export const router = createBrowserRouter(routes, {
  basename: baseName === '/' ? undefined : baseName,
});
