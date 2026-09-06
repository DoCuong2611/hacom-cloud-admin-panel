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
  { path: '/login', element: withSuspense(<LoginPage />) },
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
      { index: true, element: <Navigate to="/cloud/overview" replace /> },
      { path: 'cloud', element: <Navigate to="/cloud/overview" replace /> },
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
      { path: 'profile', element: withSuspense(<ProfilePage />) },
      { path: '*', element: withSuspense(<NotFoundPage />) },
    ],
  },
];

const rawBaseName = import.meta.env.BASE_URL || '/';
const baseName =
  rawBaseName.endsWith('/') && rawBaseName !== '/' ? rawBaseName.slice(0, -1) : rawBaseName;

export const router = createBrowserRouter(routes, {
  basename: baseName === '/' ? undefined : baseName,
});
