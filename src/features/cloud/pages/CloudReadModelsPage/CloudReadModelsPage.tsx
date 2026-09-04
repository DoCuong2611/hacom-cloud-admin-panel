import { Button, Input, Select, Typography } from 'antd';
import { useMemo, useState } from 'react';

import { DataTableShell } from '@/components/DataTableShell/DataTableShell';
import { DateTimeCell } from '@/components/DateTimeCell/DateTimeCell';
import { FilterBar } from '@/components/FilterBar/FilterBar';
import { PageShell } from '@/components/PageShell/PageShell';
import { QueryStateView } from '@/components/QueryStates/QueryStates';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import { DataTable } from '@/components/ui/DataTable/DataTable';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { MetricCard } from '@/components/ui/MetricCard/MetricCard';
import { CopyButton } from '@/components/ui/CopyButton/CopyButton';
import { AppDrawer } from '@/components/AppDrawer/AppDrawer';
import { formatBytes, formatNumber } from '@/utils/formatters/formatters';
import { formatDateTime } from '@/utils/date/date';

import { CloudCursorPagination } from '../../components/CloudCursorPagination/CloudCursorPagination';
import { CloudFeatureErrorState, CloudField } from '../../components/CloudFeatureState/CloudFeatureState';
import { useCloudCursorPagination } from '../../hooks/useCloudCursorPagination';
import {
  useCloudReadModelView,
  type CloudReadModelView,
  type CloudReadModelParams,
} from '../../hooks/useCloudReadModelView';
import type {
  CloudDriveReadModel,
  CloudItemReadModel,
  CloudOverview,
  CloudReadModelsApi,
  CloudUserReadModel,
} from '../../types/cloudOperationalTypes';
import '../../styles/cloudFeature.css';
import { CloudApiModeBanner } from '../../components/CloudApiModeBanner/CloudApiModeBanner';

const DEFAULT_PAGE_SIZE = 25;

type ReadModelRecord = CloudUserReadModel | CloudDriveReadModel | CloudItemReadModel;

interface ReadModelFilters {
  q: string;
  status: string;
  ownerUserId: string;
  driveId: string;
  type: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface CloudReadModelsPageProps {
  api: CloudReadModelsApi;
  view: CloudReadModelView;
}

interface CloudReadModelPageWrapperProps {
  api: CloudReadModelsApi;
}

const initialFilters: ReadModelFilters = {
  q: '',
  status: '',
  ownerUserId: '',
  driveId: '',
  type: '',
  sortBy: 'updatedAt',
  sortOrder: 'desc',
};

const pageConfig: Record<CloudReadModelView, { title: string; description: string; label: string }> = {
  overview: {
    title: 'Tổng quan Hacom Cloud',
    description: 'Số liệu tổng hợp do Cloud cung cấp, không cộng dồn từ các trang phân trang.',
    label: 'Tổng quan',
  },
  users: {
    title: 'Người dùng Cloud',
    description: 'Read model người dùng đã được sanitize từ Cloud.',
    label: 'Người dùng',
  },
  drives: {
    title: 'Drive Cloud',
    description: 'Metadata drive và mức sử dụng do Cloud cung cấp.',
    label: 'Drive',
  },
  items: {
    title: 'Item Cloud',
    description: 'Metadata item đã được sanitize; không hiển thị content hoặc object key.',
    label: 'Item',
  },
};

const getListParams = (
  view: Exclude<CloudReadModelView, 'overview'>,
  filters: ReadModelFilters,
  pageSize: number,
  cursor?: string,
) => {
  if (view === 'users') {
    return {
      status: filters.status || undefined,
      q: filters.q || undefined,
      sortBy: (filters.sortBy === 'usedBytes' ? 'usedBytes' : 'updatedAt') as 'usedBytes' | 'updatedAt',
      sortOrder: filters.sortOrder,
      limit: pageSize,
      cursor,
    };
  }

  if (view === 'drives') {
    return {
      ownerUserId: filters.ownerUserId || undefined,
      status: filters.status || undefined,
      sortBy: (['usedBytes', 'updatedAt', 'createdAt'].includes(filters.sortBy)
        ? filters.sortBy
        : 'updatedAt') as 'usedBytes' | 'updatedAt' | 'createdAt',
      sortOrder: filters.sortOrder,
      limit: pageSize,
      cursor,
    };
  }

  return {
    driveId: filters.driveId || undefined,
    ownerUserId: filters.ownerUserId || undefined,
    type: filters.type || undefined,
    status: filters.status || undefined,
    sortBy: (['sizeBytes', 'updatedAt', 'createdAt'].includes(filters.sortBy)
      ? filters.sortBy
      : 'updatedAt') as 'sizeBytes' | 'updatedAt' | 'createdAt',
    sortOrder: filters.sortOrder,
    limit: pageSize,
    cursor,
  };
};

const renderId = (value: string) => (
  <span>
    <Typography.Text code className="cloud-feature-code" title={value}>
      {value}
    </Typography.Text>
    <CopyButton text={value} iconOnly tooltipText="Sao chép mã" />
  </span>
);

const ReadModelDetail = ({
  record,
  view,
}: {
  record: ReadModelRecord;
  view: Exclude<CloudReadModelView, 'overview'>;
}) => {
  if (view === 'users') {
    const user = record as CloudUserReadModel;
    return (
      <>
        <div className="cloud-feature-detail-section">
          <h3>Định danh</h3>
          <div className="cloud-feature-field-grid">
            <CloudField label="User ID" value={renderId(user.userId)} />
            <CloudField label="Trạng thái" value={<StatusBadge status={user.status} />} />
            <CloudField label="Số drive" value={formatNumber(user.driveCount)} />
            <CloudField label="Số item" value={formatNumber(user.itemCount)} />
          </div>
        </div>
        <div className="cloud-feature-detail-section">
          <h3>Dung lượng</h3>
          <div className="cloud-feature-field-grid">
            <CloudField label="Quota" value={formatBytes(user.quotaBytes)} />
            <CloudField label="Đã dùng" value={formatBytes(user.usedBytes)} />
            <CloudField label="Reserved" value={formatBytes(user.reservedBytes)} />
            <CloudField label="Thùng rác" value={formatBytes(user.trashBytes)} />
          </div>
        </div>
        <div className="cloud-feature-detail-section">
          <h3>Thời gian</h3>
          <div className="cloud-feature-field-grid">
            <CloudField label="Hoạt động gần nhất" value={<DateTimeCell value={user.lastActivityAt} relative={false} />} />
            <CloudField label="Cập nhật" value={<DateTimeCell value={user.updatedAt} relative={false} />} />
          </div>
        </div>
      </>
    );
  }

  if (view === 'drives') {
    const drive = record as CloudDriveReadModel;
    return (
      <>
        <div className="cloud-feature-detail-section">
          <h3>Định danh</h3>
          <div className="cloud-feature-field-grid">
            <CloudField label="Drive ID" value={renderId(drive.driveId)} />
            <CloudField label="Owner user ID" value={renderId(drive.ownerUserId)} />
            <CloudField label="Trạng thái" value={<StatusBadge status={drive.status} />} />
            <CloudField label="Số item" value={formatNumber(drive.itemCount)} />
          </div>
        </div>
        <div className="cloud-feature-detail-section">
          <h3>Dung lượng</h3>
          <div className="cloud-feature-field-grid">
            <CloudField label="Quota" value={formatBytes(drive.quotaBytes)} />
            <CloudField label="Đã dùng" value={formatBytes(drive.usedBytes)} />
            <CloudField label="Reserved" value={formatBytes(drive.reservedBytes)} />
            <CloudField label="Thùng rác" value={formatBytes(drive.trashBytes)} />
          </div>
        </div>
        <div className="cloud-feature-detail-section">
          <h3>Thời gian</h3>
          <div className="cloud-feature-field-grid">
            <CloudField label="Hoạt động gần nhất" value={<DateTimeCell value={drive.lastActivityAt} relative={false} />} />
            <CloudField label="Cập nhật" value={<DateTimeCell value={drive.updatedAt} relative={false} />} />
          </div>
        </div>
      </>
    );
  }

  const item = record as CloudItemReadModel;
  return (
    <>
      <div className="cloud-feature-detail-section">
        <h3>Định danh</h3>
        <div className="cloud-feature-field-grid">
          <CloudField label="Item ID" value={renderId(item.itemId)} />
          <CloudField label="Drive ID" value={renderId(item.driveId)} />
          <CloudField label="Owner user ID" value={renderId(item.ownerUserId)} />
          <CloudField label="Loại" value={item.type} />
          <CloudField label="Trạng thái" value={<StatusBadge status={item.status} />} />
          <CloudField label="Kích thước" value={formatBytes(item.sizeBytes)} />
        </div>
      </div>
      <div className="cloud-feature-detail-section">
        <h3>Vòng đời</h3>
        <div className="cloud-feature-field-grid">
          <CloudField label="Tạo lúc" value={<DateTimeCell value={item.createdAt} relative={false} />} />
          <CloudField label="Cập nhật" value={<DateTimeCell value={item.updatedAt} relative={false} />} />
          <CloudField label="Xóa lúc" value={<DateTimeCell value={item.deletedAt} relative={false} />} />
          <CloudField label="Purge sau" value={<DateTimeCell value={item.purgeAfter} relative={false} />} />
        </div>
      </div>
    </>
  );
};

export const CloudReadModelsPage = ({ api, view }: CloudReadModelsPageProps) => {
  const [filters, setFilters] = useState<ReadModelFilters>(initialFilters);
  const [selectedRecord, setSelectedRecord] = useState<ReadModelRecord | null>(null);
  const pagination = useCloudCursorPagination({ defaultPageSize: DEFAULT_PAGE_SIZE });
  const config = pageConfig[view];
  const input = useMemo<CloudReadModelParams>(() => {
    if (view === 'overview') {
      return { view } as const;
    }

    return {
      view,
      params: getListParams(view, filters, pagination.pageSize, pagination.cursor),
    } as CloudReadModelParams;
  }, [filters, pagination.cursor, pagination.pageSize, view]);
  const query = useCloudReadModelView(api, input);

  const updateFilter = (key: keyof ReadModelFilters, value: string | 'asc' | 'desc') => {
    setFilters((previous) => ({ ...previous, [key]: value }));
    pagination.reset();
  };

  const resetFilters = () => {
    setFilters(initialFilters);
    pagination.reset();
  };

  if (query.isPending && !query.data) {
    return (
      <PageShell eyebrow="Hacom Cloud" title={config.title} description={config.description}>
        <QueryStateView kind="loading" title={`Đang tải ${config.label.toLowerCase()}...`} />
      </PageShell>
    );
  }

  if (query.isError && !query.data) {
    return (
      <PageShell eyebrow="Hacom Cloud" title={config.title} description={config.description}>
        <CloudFeatureErrorState error={query.error} onRetry={() => void query.refetch()} retrying={query.isFetching} />
      </PageShell>
    );
  }

  const data = query.data;

  if (!data) {
    return null;
  }

  const lastUpdated = query.dataUpdatedAt
    ? formatDateTime(new Date(query.dataUpdatedAt).toISOString())
    : undefined;

  const overview = view === 'overview' ? (data as CloudOverview) : null;
  const listData = view !== 'overview' && 'items' in data ? data : null;

  return (
    <PageShell
      eyebrow="Hacom Cloud"
      title={config.title}
      description={config.description}
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
        <div className="cloud-feature-page-stack">
        {query.isError ? (
          <CloudFeatureErrorState
            error={query.error}
            compact
            onRetry={() => void query.refetch()}
            retrying={query.isFetching}
          />
        ) : null}

        {overview ? (
          <div className="cloud-feature-metric-grid">
            <MetricCard label="Active drives" value={formatNumber(overview.activeDrives)} changeLabel="Theo Cloud overview" compact />
            <MetricCard label="Đã dùng" value={formatBytes(overview.usedBytes)} changeLabel="Theo Cloud overview" compact />
            <MetricCard label="Reserved" value={formatBytes(overview.reservedBytes)} changeLabel="Theo Cloud overview" compact />
            <MetricCard label="Thùng rác" value={formatBytes(overview.trashBytes)} changeLabel="Theo Cloud overview" compact />
            <MetricCard label="Quota chờ duyệt" value={formatNumber(overview.pendingQuotaRequests)} changeLabel="Theo Cloud overview" compact />
            <MetricCard label="Item đang xử lý" value={formatNumber(overview.processingItems)} changeLabel="Theo Cloud overview" compact />
            <MetricCard label="Item lỗi" value={formatNumber(overview.failedItems)} changeLabel="Theo Cloud overview" tone="danger" compact />
            <MetricCard label="Dead job" value={formatNumber(overview.deadJobs)} changeLabel="Theo Cloud overview" tone="warning" compact />
          </div>
        ) : null}

        {view !== 'overview' ? (
          <FilterBar className="cloud-feature-filter-bar">
            <div className="cloud-feature-filter-row">
              {view === 'users' ? (
                <div className="cloud-feature-filter-field cloud-feature-filter-field--wide">
                  <label htmlFor="cloud-users-query">Tìm user</label>
                  <Input
                    id="cloud-users-query"
                    value={filters.q}
                    placeholder="User ID"
                    allowClear
                    onChange={(event) => updateFilter('q', event.target.value)}
                  />
                </div>
              ) : null}
              {view === 'drives' || view === 'items' ? (
                <div className="cloud-feature-filter-field cloud-feature-filter-field--wide">
                  <label htmlFor="cloud-owner-user">Owner user ID</label>
                  <Input
                    id="cloud-owner-user"
                    value={filters.ownerUserId}
                    placeholder="Lọc theo owner"
                    allowClear
                    onChange={(event) => updateFilter('ownerUserId', event.target.value)}
                  />
                </div>
              ) : null}
              {view === 'items' ? (
                <>
                  <div className="cloud-feature-filter-field cloud-feature-filter-field--wide">
                    <label htmlFor="cloud-drive-id">Drive ID</label>
                    <Input
                      id="cloud-drive-id"
                      value={filters.driveId}
                      placeholder="Lọc theo drive"
                      allowClear
                      onChange={(event) => updateFilter('driveId', event.target.value)}
                    />
                  </div>
                  <div className="cloud-feature-filter-field">
                    <label htmlFor="cloud-item-type">Loại item</label>
                    <Select
                      id="cloud-item-type"
                      value={filters.type || undefined}
                      placeholder="Tất cả"
                      allowClear
                      options={[{ label: 'File', value: 'file' }, { label: 'Folder', value: 'folder' }]}
                      onChange={(value) => updateFilter('type', value ?? '')}
                    />
                  </div>
                </>
              ) : null}
              <div className="cloud-feature-filter-field">
                <label htmlFor="cloud-read-model-status">Trạng thái</label>
                <Select
                  id="cloud-read-model-status"
                  value={filters.status || undefined}
                  placeholder="Tất cả"
                  allowClear
                  options={[
                    { label: 'Active', value: 'active' },
                    { label: 'Đang xử lý', value: 'processing' },
                    { label: 'Đã xóa', value: 'deleted' },
                    { label: 'Lỗi', value: 'failed' },
                  ]}
                  onChange={(value) => updateFilter('status', value ?? '')}
                />
              </div>
              <div className="cloud-feature-filter-field">
                <label htmlFor="cloud-read-model-sort">Sắp xếp</label>
                <Select
                  id="cloud-read-model-sort"
                  value={filters.sortBy}
                  options={
                    view === 'users'
                      ? [
                          { label: 'Cập nhật', value: 'updatedAt' },
                          { label: 'Đã dùng', value: 'usedBytes' },
                        ]
                      : view === 'drives'
                        ? [
                            { label: 'Cập nhật', value: 'updatedAt' },
                            { label: 'Đã dùng', value: 'usedBytes' },
                            { label: 'Tạo lúc', value: 'createdAt' },
                          ]
                        : [
                            { label: 'Cập nhật', value: 'updatedAt' },
                            { label: 'Kích thước', value: 'sizeBytes' },
                            { label: 'Tạo lúc', value: 'createdAt' },
                          ]
                  }
                  onChange={(value) => updateFilter('sortBy', value)}
                />
              </div>
              <div className="cloud-feature-filter-field">
                <label htmlFor="cloud-read-model-order">Thứ tự</label>
                <Select
                  id="cloud-read-model-order"
                  value={filters.sortOrder}
                  options={[{ label: 'Giảm dần', value: 'desc' }, { label: 'Tăng dần', value: 'asc' }]}
                  onChange={(value) => updateFilter('sortOrder', value)}
                />
              </div>
              <div className="cloud-feature-filter-actions">
                <Button onClick={resetFilters}>Đặt lại</Button>
              </div>
            </div>
          </FilterBar>
        ) : null}

        {listData ? (
          <DataTableShell
            title={`Danh sách ${config.label.toLowerCase()}`}
            meta="Dữ liệu có giới hạn theo cursor; tổng số bản ghi không được suy diễn ở Panel."
            loading={query.isFetching && !query.isPending}
            footer={
              <CloudCursorPagination
                page={pagination.page}
                pageSize={pagination.pageSize}
                hasNextPage={Boolean(listData.nextCursor)}
                loading={query.isFetching}
                onPrevious={pagination.goPrevious}
                onNext={pagination.goNext}
                onPageSizeChange={(value) => pagination.reset(value)}
              />
            }
          >
            {view === 'users' ? (
              <DataTable<CloudUserReadModel>
                rowKey="userId"
                columns={[
                  { title: 'User ID', dataIndex: 'userId', key: 'userId', width: 220, render: renderId },
                  { title: 'Trạng thái', dataIndex: 'status', key: 'status', width: 130, render: (value: string) => <StatusBadge status={value} /> },
                  { title: 'Drive', dataIndex: 'driveCount', key: 'driveCount', width: 90, render: (value: number) => formatNumber(value) },
                  { title: 'Quota', dataIndex: 'quotaBytes', key: 'quotaBytes', width: 130, render: (value: number) => formatBytes(value) },
                  { title: 'Đã dùng', dataIndex: 'usedBytes', key: 'usedBytes', width: 130, render: (value: number) => formatBytes(value) },
                  { title: 'Item', dataIndex: 'itemCount', key: 'itemCount', width: 90, render: (value: number) => formatNumber(value) },
                  { title: 'Hoạt động gần nhất', dataIndex: 'lastActivityAt', key: 'lastActivityAt', width: 180, render: (value: string) => <DateTimeCell value={value} /> },
                ]}
                dataSource={listData.items as CloudUserReadModel[]}
                pagination={false}
                minHeight={420}
                emptyNode={<EmptyState title="Không có user" description="Không có user phù hợp với bộ lọc." />}
                onRow={(record) => ({ onClick: () => setSelectedRecord(record), style: { cursor: 'pointer' } })}
              />
            ) : null}
            {view === 'drives' ? (
              <DataTable<CloudDriveReadModel>
                rowKey="driveId"
                columns={[
                  { title: 'Drive ID', dataIndex: 'driveId', key: 'driveId', width: 220, render: renderId },
                  { title: 'Owner', dataIndex: 'ownerUserId', key: 'ownerUserId', width: 200, render: renderId },
                  { title: 'Trạng thái', dataIndex: 'status', key: 'status', width: 130, render: (value: string) => <StatusBadge status={value} /> },
                  { title: 'Quota', dataIndex: 'quotaBytes', key: 'quotaBytes', width: 130, render: (value: number) => formatBytes(value) },
                  { title: 'Đã dùng', dataIndex: 'usedBytes', key: 'usedBytes', width: 130, render: (value: number) => formatBytes(value) },
                  { title: 'Item', dataIndex: 'itemCount', key: 'itemCount', width: 90, render: (value: number) => formatNumber(value) },
                  { title: 'Hoạt động gần nhất', dataIndex: 'lastActivityAt', key: 'lastActivityAt', width: 180, render: (value: string) => <DateTimeCell value={value} /> },
                ]}
                dataSource={listData.items as CloudDriveReadModel[]}
                pagination={false}
                minHeight={420}
                emptyNode={<EmptyState title="Không có drive" description="Không có drive phù hợp với bộ lọc." />}
                onRow={(record) => ({ onClick: () => setSelectedRecord(record), style: { cursor: 'pointer' } })}
              />
            ) : null}
            {view === 'items' ? (
              <DataTable<CloudItemReadModel>
                rowKey="itemId"
                columns={[
                  { title: 'Item ID', dataIndex: 'itemId', key: 'itemId', width: 220, render: renderId },
                  { title: 'Drive ID', dataIndex: 'driveId', key: 'driveId', width: 200, render: renderId },
                  { title: 'Loại', dataIndex: 'type', key: 'type', width: 100, render: (value: string) => <StatusBadge status={value} /> },
                  { title: 'Trạng thái', dataIndex: 'status', key: 'status', width: 130, render: (value: string) => <StatusBadge status={value} /> },
                  { title: 'Kích thước', dataIndex: 'sizeBytes', key: 'sizeBytes', width: 130, render: (value: number) => formatBytes(value) },
                  { title: 'Cập nhật', dataIndex: 'updatedAt', key: 'updatedAt', width: 180, render: (value: string) => <DateTimeCell value={value} /> },
                ]}
                dataSource={listData.items as CloudItemReadModel[]}
                pagination={false}
                minHeight={420}
                emptyNode={<EmptyState title="Không có item" description="Không có item phù hợp với bộ lọc." />}
                onRow={(record) => ({ onClick: () => setSelectedRecord(record), style: { cursor: 'pointer' } })}
              />
            ) : null}
          </DataTableShell>
        ) : null}
      </div>

      {view !== 'overview' && selectedRecord ? (
        <AppDrawer
          open
          title={`Chi tiết ${config.label.toLowerCase()}`}
          width={640}
          onClose={() => setSelectedRecord(null)}
        >
          <ReadModelDetail record={selectedRecord} view={view} />
        </AppDrawer>
      ) : null}
    </PageShell>
  );
};

export const CloudOverviewPage = ({ api }: CloudReadModelPageWrapperProps) => (
  <CloudReadModelsPage api={api} view="overview" />
);

export const CloudUsersPage = ({ api }: CloudReadModelPageWrapperProps) => (
  <CloudReadModelsPage api={api} view="users" />
);

export const CloudDrivesPage = ({ api }: CloudReadModelPageWrapperProps) => (
  <CloudReadModelsPage api={api} view="drives" />
);

export const CloudItemsPage = ({ api }: CloudReadModelPageWrapperProps) => (
  <CloudReadModelsPage api={api} view="items" />
);
