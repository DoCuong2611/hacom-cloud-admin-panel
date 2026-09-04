import { Button, Input, Select, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { DataTableShell } from '@/components/DataTableShell/DataTableShell';
import { DateTimeCell } from '@/components/DateTimeCell/DateTimeCell';
import { FilterBar } from '@/components/FilterBar/FilterBar';
import { MetaCell } from '@/components/MetaCell/MetaCell';
import { PageShell } from '@/components/PageShell/PageShell';
import { QueryStateView } from '@/components/QueryStates/QueryStates';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import { AppDrawer } from '@/components/AppDrawer/AppDrawer';
import { AppModal } from '@/components/AppModal/AppModal';
import { DataTable } from '@/components/ui/DataTable/DataTable';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { CopyButton } from '@/components/ui/CopyButton/CopyButton';
import { formatBytes } from '@/utils/formatters/formatters';

import { CloudCursorPagination } from '../../components/CloudCursorPagination/CloudCursorPagination';
import { CloudFeatureErrorState, CloudField } from '../../components/CloudFeatureState/CloudFeatureState';
import { useCloudCursorPagination } from '../../hooks/useCloudCursorPagination';
import { useCloudTrash } from '../../hooks/useCloudOperationalQueries';
import type {
  CloudLifecycleAction,
  CloudTrashApi,
  CloudTrashItem,
} from '../../types/cloudOperationalTypes';
import { createCloudIdempotencyKey } from '../../utils/cloudMutation';
import '../../styles/cloudFeature.css';
import { CloudApiModeBanner } from '../../components/CloudApiModeBanner/CloudApiModeBanner';

const DEFAULT_PAGE_SIZE = 25;

interface CloudTrashPageProps {
  api: CloudTrashApi;
}

interface TrashFilters {
  driveId: string;
  ownerUserId: string;
  type: string;
  sortBy: 'deletedAt' | 'purgeAfter' | 'sizeBytes';
  sortOrder: 'asc' | 'desc';
}

const initialFilters: TrashFilters = {
  driveId: '',
  ownerUserId: '',
  type: '',
  sortBy: 'deletedAt',
  sortOrder: 'desc',
};

const actionLabels: Record<CloudLifecycleAction, string> = {
  restore: 'Khôi phục',
  purge: 'Xóa vĩnh viễn',
};

const createActionKey = (action: CloudLifecycleAction, itemId: string) =>
  createCloudIdempotencyKey(`cloud-trash-${action}-${itemId}`);

export const CloudTrashPage = ({ api }: CloudTrashPageProps) => {
  const [filters, setFilters] = useState<TrashFilters>(initialFilters);
  const [selectedItem, setSelectedItem] = useState<CloudTrashItem | null>(null);
  const [action, setAction] = useState<CloudLifecycleAction | null>(null);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const pagination = useCloudCursorPagination({ defaultPageSize: DEFAULT_PAGE_SIZE });
  const params = useMemo(
    () => ({
      driveId: filters.driveId || undefined,
      ownerUserId: filters.ownerUserId || undefined,
      type: filters.type || undefined,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      limit: pagination.pageSize,
      cursor: pagination.cursor,
    }),
    [filters, pagination.cursor, pagination.pageSize],
  );
  const { query, mutation } = useCloudTrash(api, params);

  const setNextCursor = pagination.setNextCursor;

  useEffect(() => {
    setNextCursor(query.data?.nextCursor ?? null);
  }, [setNextCursor, query.data?.nextCursor]);

  const updateFilter = (key: keyof TrashFilters, value: string | 'asc' | 'desc') => {
    setFilters((previous) => ({ ...previous, [key]: value }));
    pagination.reset();
  };

  const openAction = useCallback((nextAction: CloudLifecycleAction, item: CloudTrashItem) => {
    setSelectedItem(item);
    setAction(nextAction);
    setReason('');
    setReasonError(null);
    setIdempotencyKey(createActionKey(nextAction, item.itemId));
    mutation.reset();
  }, [mutation]);

  const closeAction = () => {
    if (mutation.isPending) {
      return;
    }

    setAction(null);
    setReason('');
    setReasonError(null);
    setIdempotencyKey(null);
    mutation.reset();
  };

  const submitAction = async () => {
    const trimmedReason = reason.trim();

    if (!trimmedReason || trimmedReason.length > 500) {
      setReasonError('Lý do bắt buộc và phải dài từ 1 đến 500 ký tự.');
      return;
    }

    if (!selectedItem || !action || !idempotencyKey) {
      return;
    }

    setReasonError(null);

    try {
      const result = await mutation.mutateAsync({
        action,
        itemId: selectedItem.itemId,
        payload: { reason: trimmedReason, idempotencyKey },
      });
      const replaySuffix = result.applied === false ? ' Kết quả này đã được áp dụng trước đó.' : '';
      setSuccessMessage(`${actionLabels[action]} item ${selectedItem.itemId} thành công.${replaySuffix}`);
      setSelectedItem(null);
      setAction(null);
      setReason('');
      setIdempotencyKey(null);
      pagination.reset();
    } catch {
      // The error is rendered inside the confirmation modal and keeps the same key for retry.
    }
  };

  const columns = useMemo<ColumnsType<CloudTrashItem>>(
    () => [
      {
        title: 'Item ID',
        dataIndex: 'itemId',
        key: 'itemId',
        width: 220,
        render: (value: string) => (
          <MetaCell
            primary={
              <span>
                <Typography.Text code className="cloud-feature-code" title={value}>
                  {value}
                </Typography.Text>
                <CopyButton text={value} iconOnly tooltipText="Sao chép mã item" />
              </span>
            }
          />
        ),
      },
      {
        title: 'Drive ID',
        dataIndex: 'driveId',
        key: 'driveId',
        width: 200,
        ellipsis: true,
      },
      {
        title: 'Loại',
        dataIndex: 'type',
        key: 'type',
        width: 100,
        render: (value: string) => <StatusBadge status={value} />,
      },
      {
        title: 'Kích thước',
        dataIndex: 'sizeBytes',
        key: 'sizeBytes',
        width: 130,
        render: (value: number) => formatBytes(value),
      },
      {
        title: 'Xóa lúc',
        dataIndex: 'deletedAt',
        key: 'deletedAt',
        width: 180,
        render: (value: string) => <DateTimeCell value={value} />,
      },
      {
        title: 'Purge sau',
        dataIndex: 'purgeAfter',
        key: 'purgeAfter',
        width: 180,
        render: (value: string) => <DateTimeCell value={value} />,
      },
      {
        title: 'Thao tác',
        key: 'actions',
        fixed: 'right',
        width: 190,
        render: (_, record) => (
          <div>
            <Button
              type="link"
              onClick={(event) => {
                event.stopPropagation();
                setSelectedItem(record);
              }}
            >
              Chi tiết
            </Button>
            <Button
              type="link"
              onClick={(event) => {
                event.stopPropagation();
                openAction('restore', record);
              }}
            >
              Khôi phục
            </Button>
          </div>
        ),
      },
    ],
    [openAction],
  );

  if (query.isPending && !query.data) {
    return (
      <PageShell eyebrow="Hacom Cloud" title="Thùng rác Cloud" description="Quản lý item soft-delete theo contract lifecycle.">
        <QueryStateView kind="loading" title="Đang tải thùng rác..." />
      </PageShell>
    );
  }

  if (query.isError && !query.data) {
    return (
      <PageShell eyebrow="Hacom Cloud" title="Thùng rác Cloud" description="Quản lý item soft-delete theo contract lifecycle.">
        <CloudFeatureErrorState error={query.error} onRetry={() => void query.refetch()} retrying={query.isFetching} />
      </PageShell>
    );
  }

  const data = query.data;

  if (!data) {
    return null;
  }

  return (
    <PageShell
      eyebrow="Hacom Cloud"
      title="Thùng rác Cloud"
      description="Các thao tác khôi phục và xóa vĩnh viễn luôn cần xác nhận và lý do."
      isRefreshing={query.isFetching}
      onRefresh={() => void query.refetch()}
      headerExtra={<Button loading={query.isFetching} onClick={() => void query.refetch()}>Làm mới</Button>}
    >
              <CloudApiModeBanner />
        <div className="cloud-feature-page-stack">
        {successMessage ? (
          <div className="cloud-feature-success" role="status">
            <Typography.Text>{successMessage}</Typography.Text>
            <Button type="link" onClick={() => setSuccessMessage(null)}>Đóng</Button>
          </div>
        ) : null}
        {query.isError ? (
          <CloudFeatureErrorState error={query.error} compact onRetry={() => void query.refetch()} retrying={query.isFetching} />
        ) : null}

        <FilterBar className="cloud-feature-filter-bar">
          <div className="cloud-feature-filter-row">
            <div className="cloud-feature-filter-field cloud-feature-filter-field--wide">
              <label htmlFor="cloud-trash-drive">Drive ID</label>
              <Input id="cloud-trash-drive" value={filters.driveId} allowClear onChange={(event) => updateFilter('driveId', event.target.value)} />
            </div>
            <div className="cloud-feature-filter-field cloud-feature-filter-field--wide">
              <label htmlFor="cloud-trash-owner">Owner user ID</label>
              <Input id="cloud-trash-owner" value={filters.ownerUserId} allowClear onChange={(event) => updateFilter('ownerUserId', event.target.value)} />
            </div>
            <div className="cloud-feature-filter-field">
              <label htmlFor="cloud-trash-type">Loại item</label>
              <Select id="cloud-trash-type" value={filters.type || undefined} placeholder="Tất cả" allowClear options={[{ label: 'File', value: 'file' }, { label: 'Folder', value: 'folder' }]} onChange={(value) => updateFilter('type', value ?? '')} />
            </div>
            <div className="cloud-feature-filter-field">
              <label htmlFor="cloud-trash-sort">Sắp xếp</label>
              <Select id="cloud-trash-sort" value={filters.sortBy} options={[{ label: 'Xóa lúc', value: 'deletedAt' }, { label: 'Purge sau', value: 'purgeAfter' }, { label: 'Kích thước', value: 'sizeBytes' }]} onChange={(value) => updateFilter('sortBy', value)} />
            </div>
            <div className="cloud-feature-filter-field">
              <label htmlFor="cloud-trash-order">Thứ tự</label>
              <Select id="cloud-trash-order" value={filters.sortOrder} options={[{ label: 'Giảm dần', value: 'desc' }, { label: 'Tăng dần', value: 'asc' }]} onChange={(value) => updateFilter('sortOrder', value)} />
            </div>
            <div className="cloud-feature-filter-actions">
              <Button onClick={() => { setFilters(initialFilters); pagination.reset(); }}>Đặt lại</Button>
            </div>
          </div>
        </FilterBar>

        <DataTableShell
          title="Danh sách item trong thùng rác"
          meta="Retention và invariant lifecycle do Cloud enforce; Panel chỉ gửi thao tác đã xác nhận."
          loading={query.isFetching && !query.isPending}
          footer={<CloudCursorPagination page={pagination.page} pageSize={pagination.pageSize} hasNextPage={Boolean(data.nextCursor)} loading={query.isFetching} onPrevious={pagination.goPrevious} onNext={pagination.goNext} onPageSizeChange={(value) => pagination.reset(value)} />}
        >
          <DataTable<CloudTrashItem>
            rowKey="itemId"
            columns={columns}
            dataSource={data.items}
            pagination={false}
            minHeight={420}
            emptyNode={<EmptyState title="Thùng rác trống" description="Không có item phù hợp với bộ lọc." />}
            onRow={(record) => ({ onClick: () => setSelectedItem(record), style: { cursor: 'pointer' } })}
          />
        </DataTableShell>
      </div>

      <AppDrawer open={Boolean(selectedItem) && !action} title="Chi tiết item đã xóa" onClose={() => setSelectedItem(null)} width={620}>
        {selectedItem ? (
          <>
            <div className="cloud-feature-detail-section">
              <h3>Định danh</h3>
              <div className="cloud-feature-field-grid">
                <CloudField label="Item ID" value={selectedItem.itemId} />
                <CloudField label="Drive ID" value={selectedItem.driveId} />
                <CloudField label="Owner user ID" value={selectedItem.ownerUserId} />
                <CloudField label="Loại" value={selectedItem.type} />
              </div>
            </div>
            <div className="cloud-feature-detail-section">
              <h3>Retention</h3>
              <div className="cloud-feature-field-grid">
                <CloudField label="Kích thước" value={formatBytes(selectedItem.sizeBytes)} />
                <CloudField label="Xóa lúc" value={<DateTimeCell value={selectedItem.deletedAt} relative={false} />} />
                <CloudField label="Purge sau" value={<DateTimeCell value={selectedItem.purgeAfter} relative={false} />} />
                <CloudField label="Trạng thái" value={<StatusBadge status={selectedItem.status} />} />
              </div>
            </div>
            <div className="cloud-feature-filter-actions">
              <Button onClick={() => openAction('restore', selectedItem)}>Khôi phục</Button>
              <Button danger onClick={() => openAction('purge', selectedItem)}>Xóa vĩnh viễn</Button>
            </div>
          </>
        ) : null}
      </AppDrawer>

      <AppModal
        open={Boolean(action) && Boolean(selectedItem)}
        title={action ? `${actionLabels[action]} item` : undefined}
        onClose={closeAction}
        width={520}
        footer={
          <>
            <Button onClick={closeAction} disabled={mutation.isPending}>Hủy</Button>
            <Button type="primary" danger={action === 'purge'} loading={mutation.isPending} onClick={() => void submitAction()}>
              Xác nhận {action ? actionLabels[action].toLowerCase() : ''}
            </Button>
          </>
        }
      >
        {selectedItem && action ? (
          <div className="cloud-feature-page-stack">
            <Typography.Paragraph>
              Thao tác này sẽ được backend kiểm tra theo trạng thái item và chính sách retention.
              Retry phải dùng lại cùng Idempotency-Key.
            </Typography.Paragraph>
            <div className="cloud-feature-modal-summary">
              <CloudField label="Item ID" value={selectedItem.itemId} />
              <CloudField label="Thao tác" value={actionLabels[action]} />
            </div>
            <div className="cloud-feature-filter-field">
              <label htmlFor="cloud-lifecycle-reason">Lý do bắt buộc</label>
              <Input.TextArea id="cloud-lifecycle-reason" value={reason} maxLength={500} showCount rows={4} status={reasonError ? 'error' : undefined} onChange={(event) => { setReason(event.target.value); setReasonError(null); }} />
              {reasonError ? <Typography.Text type="danger">{reasonError}</Typography.Text> : null}
            </div>
            {mutation.isError ? <CloudFeatureErrorState error={mutation.error} compact /> : null}
          </div>
        ) : null}
      </AppModal>
    </PageShell>
  );
};
