import { Button, Select, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { DataTableShell } from '@/components/DataTableShell/DataTableShell';
import { DateTimeCell } from '@/components/DateTimeCell/DateTimeCell';
import { FilterBar } from '@/components/FilterBar/FilterBar';
import { MetaCell } from '@/components/MetaCell/MetaCell';
import { PageShell } from '@/components/PageShell/PageShell';
import { QueryStateView } from '@/components/QueryStates/QueryStates';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import { DataTable } from '@/components/ui/DataTable/DataTable';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { formatBytes } from '@/utils/formatters/formatters';
import { formatDateTime } from '@/utils/date/date';

import { CloudQuotaDetailDrawer } from '../../components/CloudQuotaDetailDrawer/CloudQuotaDetailDrawer';
import { CloudQuotaErrorState } from '../../components/CloudQuotaErrorState/CloudQuotaErrorState';
import { CloudQuotaReviewModal } from '../../components/CloudQuotaReviewModal/CloudQuotaReviewModal';
import { useCloudQuotaRequests } from '../../hooks/useCloudQuotaRequests';
import type {
  CloudQuotaRequest,
  CloudQuotaRequestStatus,
  CloudQuotaReviewAction,
  CloudQuotaReviewApi,
} from '../../types/cloudQuotaTypes';
import './CloudQuotaRequestsPage.css';
import { CloudApiModeBanner } from '../../components/CloudApiModeBanner/CloudApiModeBanner';

const DEFAULT_PAGE_SIZE = 25;

const statusOptions: Array<{ label: string; value: CloudQuotaRequestStatus }> = [
  { label: 'Chờ duyệt', value: 'pending' },
  { label: 'Đã duyệt', value: 'approved' },
  { label: 'Đã từ chối', value: 'rejected' },
];

const statusLabels: Record<CloudQuotaRequestStatus, string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Đã từ chối',
};

const createIdempotencyKey = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `cloud-quota-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
};

export interface CloudQuotaRequestsPageProps {
  api: CloudQuotaReviewApi;
}

export const CloudQuotaRequestsPage = ({ api }: CloudQuotaRequestsPageProps) => {
  const [status, setStatus] = useState<CloudQuotaRequestStatus>('pending');
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [page, setPage] = useState(1);
  const [pageCursors, setPageCursors] = useState<Record<number, string>>({});
  const [selectedRequest, setSelectedRequest] = useState<CloudQuotaRequest | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<CloudQuotaReviewAction | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const cursor = pageCursors[page];
  const { query, reviewMutation } = useCloudQuotaRequests({
    api,
    status,
    limit: pageSize,
    cursor,
  });

  const nextCursor = query.data?.nextCursor ?? null;

  useEffect(() => {
    if (query.data?.nextCursor && pageCursors[page + 1] !== query.data.nextCursor) {
      setPageCursors((previous) => ({ ...previous, [page + 1]: query.data?.nextCursor ?? '' }));
    }
  }, [page, pageCursors, query.data?.nextCursor]);

  const resetPaging = useCallback(() => {
    setPage(1);
    setPageCursors({});
  }, []);

  const handleStatusChange = useCallback(
    (nextStatus: CloudQuotaRequestStatus) => {
      setStatus(nextStatus);
      resetPaging();
      setSuccessMessage(null);
    },
    [resetPaging],
  );

  const handlePageSizeChange = useCallback(
    (nextPageSize: number) => {
      setPageSize(nextPageSize);
      resetPaging();
    },
    [resetPaging],
  );

  const openDetail = useCallback((request: CloudQuotaRequest) => {
    setSelectedRequest(request);
    setDetailOpen(true);
    setSuccessMessage(null);
  }, []);

  const closeReview = useCallback(() => {
    setReviewAction(null);
    setIdempotencyKey(null);
    reviewMutation.reset();
  }, [reviewMutation]);

  const startReview = useCallback(
    (action: CloudQuotaReviewAction) => {
      if (!selectedRequest || selectedRequest.status !== 'pending') {
        return;
      }

      reviewMutation.reset();
      setDetailOpen(false);
      setReviewAction(action);
      setIdempotencyKey(createIdempotencyKey());
    },
    [reviewMutation, selectedRequest],
  );

  const submitReview = useCallback(
    async (note: string) => {
      if (!selectedRequest || !reviewAction || !idempotencyKey) {
        return;
      }

      const result = await reviewMutation.mutateAsync({
        action: reviewAction,
        requestId: selectedRequest.id,
        note: note || undefined,
        idempotencyKey,
      });

      const verb = reviewAction === 'approve' ? 'Duyệt' : 'Từ chối';
      const replaySuffix = result.applied === false ? ' Kết quả này đã được áp dụng trước đó.' : '';
      setSuccessMessage(`${verb} quota request ${selectedRequest.id} thành công.${replaySuffix}`);
      setReviewAction(null);
      setSelectedRequest(null);
      setDetailOpen(false);
      setIdempotencyKey(null);
      resetPaging();
    },
    [idempotencyKey, resetPaging, reviewAction, reviewMutation, selectedRequest],
  );

  const columns = useMemo<ColumnsType<CloudQuotaRequest>>(
    () => [
      {
        title: 'Request ID',
        dataIndex: 'id',
        key: 'id',
        width: 190,
        ellipsis: true,
        render: (value: string) => <Typography.Text code title={value}>{value}</Typography.Text>,
      },
      {
        title: 'Owner user ID',
        dataIndex: 'ownerUserId',
        key: 'ownerUserId',
        width: 190,
        ellipsis: true,
        render: (value: string) => <MetaCell primary={value} />,
      },
      {
        title: 'Quota yêu cầu',
        dataIndex: 'requestedQuotaBytes',
        key: 'requestedQuotaBytes',
        width: 160,
        render: (value: number, record) => (
          <MetaCell
            primary={formatBytes(value)}
            secondary={`Hiện tại ${formatBytes(record.currentQuotaBytes)}`}
          />
        ),
      },
      {
        title: 'Đã sử dụng',
        dataIndex: 'usedBytes',
        key: 'usedBytes',
        width: 130,
        render: (value: number, record) => (
          <MetaCell primary={formatBytes(value)} secondary={`Reserved ${formatBytes(record.reservedBytes)}`} />
        ),
      },
      {
        title: 'Trạng thái',
        dataIndex: 'status',
        key: 'status',
        width: 130,
        render: (value: CloudQuotaRequestStatus) => <StatusBadge status={value} showIcon />,
      },
      {
        title: 'Tạo lúc',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 160,
        render: (value: string) => <DateTimeCell value={value} />,
      },
      {
        title: 'Thao tác',
        key: 'actions',
        fixed: 'right',
        width: 100,
        render: (_, record) => (
          <Button
            type="link"
            aria-label={`Xem chi tiết ${record.id}`}
            onClick={(event) => {
              event.stopPropagation();
              openDetail(record);
            }}
          >
            Chi tiết
          </Button>
        ),
      },
    ],
    [openDetail],
  );

  const pageHeader = {
    eyebrow: 'Hacom Cloud',
    title: 'Quota requests',
    description: 'Xem và xử lý yêu cầu tăng dung lượng theo trạng thái backend.',
  };

  if (query.isPending && !query.data) {
    return (
      <PageShell {...pageHeader}>
        <QueryStateView kind="loading" title="Đang tải danh sách quota..." />
      </PageShell>
    );
  }

  if (query.isError && !query.data) {
    return (
      <PageShell {...pageHeader}>
        <CloudQuotaErrorState error={query.error} onRetry={() => void query.refetch()} retrying={query.isFetching} />
      </PageShell>
    );
  }

  const rows = query.data?.items ?? [];
  const lastUpdated = query.dataUpdatedAt
    ? formatDateTime(new Date(query.dataUpdatedAt).toISOString())
    : undefined;

  return (
    <PageShell
      {...pageHeader}
      lastUpdated={lastUpdated}
      isRefreshing={query.isFetching}
      onRefresh={() => void query.refetch()}
      headerExtra={
        <Button loading={query.isFetching} onClick={() => void query.refetch()}>
          Làm mới
        </Button>
      }
    >
              <CloudApiModeBanner />
        <div className="cloud-quota-page-stack">
        {successMessage ? (
          <div role="status" className="cloud-quota-success">
            <Typography.Text>{successMessage}</Typography.Text>
            <Button type="link" onClick={() => setSuccessMessage(null)}>
              Đóng
            </Button>
          </div>
        ) : null}

        <FilterBar className="cloud-quota-filter-bar">
          <div className="cloud-quota-filter-row">
            <div className="cloud-quota-filter-field">
              <label htmlFor="cloud-quota-status">Trạng thái quota</label>
              <Select
                id="cloud-quota-status"
                value={status}
                options={statusOptions}
                onChange={handleStatusChange}
                aria-label="Trạng thái quota"
              />
            </div>
            <div className="cloud-quota-filter-field cloud-quota-filter-field--summary">
              <Typography.Text type="secondary">
                {rows.length} request trong trang {page} · {statusLabels[status]}
              </Typography.Text>
            </div>
            <div className="cloud-quota-filter-actions">
              <Button
                onClick={() => {
                  setStatus('pending');
                  setPageSize(DEFAULT_PAGE_SIZE);
                  resetPaging();
                }}
                disabled={status === 'pending' && pageSize === DEFAULT_PAGE_SIZE && page === 1}
              >
                Mặc định
              </Button>
            </div>
          </div>
        </FilterBar>

        {query.isError ? (
          <CloudQuotaErrorState
            error={query.error}
            compact
            onRetry={() => void query.refetch()}
            retrying={query.isFetching}
          />
        ) : null}

        <DataTableShell
          title="Danh sách quota request"
          meta="Dữ liệu và trạng thái lấy từ Admin Service; không suy diễn ở trình duyệt."
          loading={query.isFetching && !query.isPending}
          footer={
            <div className="cloud-quota-pagination" aria-label="Phân trang quota request">
              <Button
                onClick={() => setPage((previous) => Math.max(1, previous - 1))}
                disabled={page === 1 || query.isFetching}
              >
                Trước
              </Button>
              <Typography.Text>Trang {page}</Typography.Text>
              <Button
                onClick={() => {
                  if (!nextCursor) {
                    return;
                  }

                  setPageCursors((previous) => ({ ...previous, [page + 1]: nextCursor }));
                  setPage((previous) => previous + 1);
                }}
                disabled={!nextCursor || query.isFetching}
              >
                Tiếp
              </Button>
              <Select
                aria-label="Số dòng mỗi trang"
                value={pageSize}
                options={[10, 25, 50, 100].map((value) => ({ label: `${value}/trang`, value }))}
                onChange={handlePageSizeChange}
              />
            </div>
          }
        >
          <DataTable
            rowKey="id"
            columns={columns}
            dataSource={rows}
            loading={query.isFetching && !query.isPending}
            minHeight={420}
            pagination={false}
            emptyNode={
              <EmptyState
                title="Không có quota request"
                description="Không có request phù hợp với trạng thái đang chọn."
              />
            }
            onRow={(record) => ({
              onClick: () => openDetail(record),
              style: { cursor: 'pointer' },
            })}
          />
        </DataTableShell>
      </div>

      <CloudQuotaDetailDrawer
        open={detailOpen}
        request={selectedRequest}
        onClose={() => setDetailOpen(false)}
        onReview={startReview}
      />

      <CloudQuotaReviewModal
        open={Boolean(reviewAction)}
        request={selectedRequest}
        action={reviewAction}
        error={reviewMutation.error}
        loading={reviewMutation.isPending}
        onCancel={closeReview}
        onSubmit={(note) => {
          void submitReview(note).catch(() => undefined);
        }}
      />
    </PageShell>
  );
};
