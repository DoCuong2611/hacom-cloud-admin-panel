import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import type * as AntdModule from 'antd';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

import { CloudAuditPage } from './CloudAuditPage/CloudAuditPage';
import { CloudJobsPage } from './CloudJobsPage/CloudJobsPage';
import {
  CloudOverviewPage,
  CloudUsersPage,
} from './CloudReadModelsPage/CloudReadModelsPage';
import { CloudObservabilityPage } from './CloudObservabilityPage/CloudObservabilityPage';
import { CloudTrashPage } from './CloudTrashPage/CloudTrashPage';
import type {
  CloudAuditApi,
  CloudJobsApi,
  CloudReadModelsApi,
  CloudTrashApi,
} from '../types/cloudOperationalTypes';

vi.mock('antd', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof AntdModule;
  const MockOverlay = ({
    open,
    title,
    children,
    footer,
  }: {
    open?: boolean;
    title?: ReactNode;
    children?: ReactNode;
    footer?: ReactNode;
  }) =>
    open ? (
      <div role="dialog" aria-label={typeof title === 'string' ? title : undefined}>
        {title ? <h2>{title}</h2> : null}
        {children}
        {footer ? <div>{footer}</div> : null}
      </div>
    ) : null;

  return { ...actual, Modal: MockOverlay, Drawer: MockOverlay };
});

const renderWithClient = (children: ReactNode) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>);
};

const createReadModelsApi = (): CloudReadModelsApi => ({
  getOverview: vi.fn(),
  listUsers: vi.fn(),
  listDrives: vi.fn(),
  listItems: vi.fn(),
});

describe('Cloud operational pages', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('renders observability degraded state and preserves null signals', async () => {
    const api = {
      getSummary: vi.fn().mockResolvedValue({
        generatedAt: '2026-08-27T08:00:00.000Z',
        freshness: 'partial',
        sources: {
          prometheus: 'degraded',
          cloudApiMetrics: 'available',
          cloudWorkerMetrics: 'unavailable',
          grafana: { status: 'unavailable' },
        },
        signals: {
          searchP95Ms: null,
          quotaRequestRatePerMinute: 2,
          reviewErrorRatePerMinute: null,
          workerDeadJobsIncrease: 1,
          workerRetryRatePerMinute: null,
        },
        warnings: ['Worker metrics chưa khả dụng.'],
      }),
    };

    renderWithClient(<CloudObservabilityPage api={api} />);

    expect(await screen.findByText('Trạng thái giám sát: Một phần')).toBeInTheDocument();
    expect(screen.getByText('Worker metrics chưa khả dụng.')).toBeInTheDocument();
    expect(screen.getAllByText('-').length).toBeGreaterThan(0);
  });

  it('renders overview metrics without requiring list endpoints', async () => {
    const api = createReadModelsApi();
    api.getOverview.mockResolvedValue({
      generatedAt: '2026-08-27T08:00:00.000Z',
      activeDrives: 4,
      usedBytes: 1024,
      reservedBytes: 2048,
      trashBytes: 512,
      pendingQuotaRequests: 2,
      processingItems: 1,
      failedItems: 0,
      deadJobs: 0,
    });

    renderWithClient(<CloudOverviewPage api={api} />);

    expect(await screen.findByText('4')).toBeInTheDocument();
    expect(screen.getByText('Tổng quan Hacom Cloud')).toBeInTheDocument();
    expect(screen.getByText('Active drives')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(api.listUsers).not.toHaveBeenCalled();
    expect(api.listDrives).not.toHaveBeenCalled();
    expect(api.listItems).not.toHaveBeenCalled();
  });

  it('opens a read model detail drawer from the users table', async () => {
    const api = createReadModelsApi();
    api.listUsers.mockResolvedValue({
      items: [{
        userId: 'user-1',
        status: 'active',
        driveCount: 1,
        quotaBytes: 1024,
        usedBytes: 512,
        reservedBytes: 0,
        trashBytes: 0,
        itemCount: 3,
        lastActivityAt: '2026-08-27T08:00:00.000Z',
        createdAt: '2026-08-27T08:00:00.000Z',
        updatedAt: '2026-08-27T08:00:00.000Z',
      }],
      nextCursor: null,
    });

    renderWithClient(<CloudUsersPage api={api} />);

    expect(await screen.findByText('user-1')).toBeInTheDocument();
    fireEvent.click(screen.getByText('user-1'));

    expect(await screen.findByText('Chi tiết người dùng')).toBeInTheDocument();
    expect(screen.getByText('Số drive')).toBeInTheDocument();
  });

  it('requires a lifecycle reason before sending a purge mutation', async () => {
    const api: CloudTrashApi = {
      list: vi.fn().mockResolvedValue({
        items: [{
          itemId: 'item-trash-1',
          driveId: 'drive-1',
          ownerUserId: 'user-1',
          type: 'file',
          status: 'deleted',
          sizeBytes: 1024,
          createdAt: '2026-08-27T08:00:00.000Z',
          updatedAt: '2026-08-27T08:00:00.000Z',
          deletedAt: '2026-08-27T08:00:00.000Z',
          purgeAfter: '2026-09-27T08:00:00.000Z',
        }],
        nextCursor: null,
      }),
      restore: vi.fn(),
      purge: vi.fn().mockResolvedValue({}),
    };

    renderWithClient(<CloudTrashPage api={api} />);

    expect(await screen.findByText('item-trash-1')).toBeInTheDocument();
    fireEvent.click(screen.getByText('item-trash-1'));
    fireEvent.click(await screen.findByRole('button', { name: 'Xóa vĩnh viễn' }));
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận xóa vĩnh viễn' }));

    expect(await screen.findByText('Lý do bắt buộc và phải dài từ 1 đến 500 ký tự.')).toBeInTheDocument();
    expect(api.purge).not.toHaveBeenCalled();
  });

  it('requests worker jobs with bounded cursor pagination', () => {
    const job = {
      jobId: 'job-1',
      type: 'metadata-index',
      status: 'failed' as const,
      resourceType: 'item',
      resourceId: 'item-1',
      attempts: 2,
      maxAttempts: 3,
      createdAt: '2026-08-27T08:00:00.000Z',
      startedAt: '2026-08-27T08:01:00.000Z',
      finishedAt: '2026-08-27T08:02:00.000Z',
      nextRetryAt: null,
      lastErrorCode: 'INDEX_FAILED',
    };
    const api: CloudJobsApi = {
      list: vi.fn().mockResolvedValue({ items: [job], nextCursor: null }),
      get: vi.fn().mockResolvedValue(job),
      retry: vi.fn(),
      cancel: vi.fn(),
    };

    renderWithClient(<CloudJobsPage api={api} />);

    expect(api.list).toHaveBeenCalledWith(expect.objectContaining({
      limit: 25,
      cursor: undefined,
      status: undefined,
    }));
    expect(screen.queryByRole('button', { name: 'Hủy job' })).not.toBeInTheDocument();
  });

  it('masks sensitive audit metadata in the detail drawer', async () => {
    const api: CloudAuditApi = {
      list: vi.fn().mockResolvedValue({
        items: [{
          auditId: 'audit-1',
          actorId: 'admin-1',
          action: 'cloud.read',
          resourceType: 'overview',
          resourceId: 'cloud',
          outcome: 'success',
          requestId: 'request-1',
          operationId: 'operation-1',
          createdAt: '2026-08-27T08:00:00.000Z',
          metadata: { secret: 'should-not-render', safe: 'shown' },
        }],
        nextCursor: null,
      }),
    };

    renderWithClient(<CloudAuditPage api={api} />);

    expect(await screen.findByText('audit-1')).toBeInTheDocument();
    fireEvent.click(screen.getByText('audit-1'));

    expect(await screen.findByText('Metadata đã mask')).toBeInTheDocument();
    expect(screen.getByText(/đã ẩn/)).toBeInTheDocument();
    expect(screen.getByText(/shown/)).toBeInTheDocument();
    expect(screen.queryByText('should-not-render')).not.toBeInTheDocument();
  });
});
