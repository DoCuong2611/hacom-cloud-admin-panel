import { Button, Input, Select, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useMemo, useState } from 'react';

import { DataTableShell } from '@/components/DataTableShell/DataTableShell';
import { DateTimeCell } from '@/components/DateTimeCell/DateTimeCell';
import { FilterBar } from '@/components/FilterBar/FilterBar';
import { MetaCell } from '@/components/MetaCell/MetaCell';
import { PageShell } from '@/components/PageShell/PageShell';
import { QueryStateView } from '@/components/QueryStates/QueryStates';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import { AppDrawer } from '@/components/AppDrawer/AppDrawer';
import { DataTable } from '@/components/ui/DataTable/DataTable';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { CopyButton } from '@/components/ui/CopyButton/CopyButton';

import { CloudCursorPagination } from '../../components/CloudCursorPagination/CloudCursorPagination';
import { CloudFeatureErrorState, CloudField } from '../../components/CloudFeatureState/CloudFeatureState';
import { useCloudCursorPagination } from '../../hooks/useCloudCursorPagination';
import { useCloudAudit } from '../../hooks/useCloudOperationalQueries';
import type { CloudAuditApi, CloudAuditEvent } from '../../types/cloudOperationalTypes';
import '../../styles/cloudFeature.css';
import { CloudApiModeBanner } from '../../components/CloudApiModeBanner/CloudApiModeBanner';

const DEFAULT_PAGE_SIZE = 25;
const sensitiveKeyPattern = /token|secret|password|authorization|cookie|object.?key|signed.?url|credential/i;

interface CloudAuditPageProps {
  api: CloudAuditApi;
}

interface AuditFilters {
  actorId: string;
  action: string;
  resourceType: string;
  outcome: string;
  from: string;
  to: string;
  sortOrder: 'asc' | 'desc';
}

const initialFilters: AuditFilters = {
  actorId: '',
  action: '',
  resourceType: '',
  outcome: '',
  from: '',
  to: '',
  sortOrder: 'desc',
};

const toIsoOrUndefined = (value: string): string | undefined => {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
};

const sanitizeMetadata = (value: unknown, key?: string): unknown => {
  if (key && sensitiveKeyPattern.test(key)) {
    return '[đã ẩn]';
  }

  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeMetadata(entry));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [
        entryKey,
        sanitizeMetadata(entryValue, entryKey),
      ]),
    );
  }

  return value;
};

const renderId = (value: string, label: string) => (
  <span>
    <Typography.Text code className="cloud-feature-code" title={value}>{value}</Typography.Text>
    <CopyButton text={value} iconOnly tooltipText={`Sao chép ${label}`} />
  </span>
);

export const CloudAuditPage = ({ api }: CloudAuditPageProps) => {
  const [filters, setFilters] = useState<AuditFilters>(initialFilters);
  const [selectedEvent, setSelectedEvent] = useState<CloudAuditEvent | null>(null);
  const pagination = useCloudCursorPagination({ defaultPageSize: DEFAULT_PAGE_SIZE });
  const params = useMemo(
    () => ({
      actorId: filters.actorId || undefined,
      action: filters.action || undefined,
      resourceType: filters.resourceType || undefined,
      outcome: filters.outcome || undefined,
      from: toIsoOrUndefined(filters.from),
      to: toIsoOrUndefined(filters.to),
      sortOrder: filters.sortOrder,
      limit: pagination.pageSize,
      cursor: pagination.cursor,
    }),
    [filters, pagination.cursor, pagination.pageSize],
  );
  const query = useCloudAudit(api, params);

  const setNextCursor = pagination.setNextCursor;

  useEffect(() => {
    setNextCursor(query.data?.nextCursor ?? null);
  }, [setNextCursor, query.data?.nextCursor]);

  const updateFilter = (key: keyof AuditFilters, value: string) => {
    setFilters((previous) => ({ ...previous, [key]: value } as AuditFilters));
    pagination.reset();
  };

  const columns = useMemo<ColumnsType<CloudAuditEvent>>(
    () => [
      {
        title: 'Audit ID',
        dataIndex: 'auditId',
        key: 'auditId',
        width: 210,
        render: (value: string) => <MetaCell primary={renderId(value, 'audit ID')} />,
      },
      { title: 'Actor', dataIndex: 'actorId', key: 'actorId', width: 180, ellipsis: true },
      { title: 'Action', dataIndex: 'action', key: 'action', width: 170, ellipsis: true },
      { title: 'Resource', dataIndex: 'resourceType', key: 'resourceType', width: 150, render: (value: string, record) => <MetaCell primary={value} secondary={record.resourceId} /> },
      { title: 'Kết quả', dataIndex: 'outcome', key: 'outcome', width: 130, render: (value: string) => <StatusBadge status={value} /> },
      { title: 'Request ID', dataIndex: 'requestId', key: 'requestId', width: 190, ellipsis: true },
      { title: 'Thời gian', dataIndex: 'createdAt', key: 'createdAt', width: 180, render: (value: string) => <DateTimeCell value={value} /> },
      { title: 'Chi tiết', key: 'detail', fixed: 'right', width: 100, render: (_, record) => <Button type="link" onClick={(event) => { event.stopPropagation(); setSelectedEvent(record); }}>Xem</Button> },
    ],
    [],
  );

  if (query.isPending && !query.data) {
    return <PageShell eyebrow="Hacom Cloud" title="Cloud audit" description="Nhật ký append-only đã được mask từ backend."><QueryStateView kind="loading" title="Đang tải Cloud audit..." /></PageShell>;
  }

  if (query.isError && !query.data) {
    return <PageShell eyebrow="Hacom Cloud" title="Cloud audit" description="Nhật ký append-only đã được mask từ backend."><CloudFeatureErrorState error={query.error} onRetry={() => void query.refetch()} retrying={query.isFetching} /></PageShell>;
  }

  const data = query.data;

  if (!data) {
    return null;
  }

  return (
    <PageShell
      eyebrow="Hacom Cloud"
      title="Cloud audit"
      description="Nhật ký chỉ đọc, có giới hạn theo cursor và không có thao tác sửa/xóa."
      isRefreshing={query.isFetching}
      onRefresh={() => void query.refetch()}
      headerExtra={<Button loading={query.isFetching} onClick={() => void query.refetch()}>Làm mới</Button>}
    >
              <CloudApiModeBanner />
        <div className="cloud-feature-page-stack">
        {query.isError ? <CloudFeatureErrorState error={query.error} compact onRetry={() => void query.refetch()} retrying={query.isFetching} /> : null}
        <FilterBar className="cloud-feature-filter-bar">
          <div className="cloud-feature-filter-row">
            <div className="cloud-feature-filter-field cloud-feature-filter-field--wide"><label htmlFor="cloud-audit-actor">Actor ID</label><Input id="cloud-audit-actor" value={filters.actorId} allowClear onChange={(event) => updateFilter('actorId', event.target.value)} /></div>
            <div className="cloud-feature-filter-field cloud-feature-filter-field--wide"><label htmlFor="cloud-audit-action">Action</label><Input id="cloud-audit-action" value={filters.action} allowClear onChange={(event) => updateFilter('action', event.target.value)} /></div>
            <div className="cloud-feature-filter-field"><label htmlFor="cloud-audit-resource">Resource type</label><Input id="cloud-audit-resource" value={filters.resourceType} allowClear onChange={(event) => updateFilter('resourceType', event.target.value)} /></div>
            <div className="cloud-feature-filter-field"><label htmlFor="cloud-audit-outcome">Kết quả</label><Select id="cloud-audit-outcome" value={filters.outcome || undefined} placeholder="Tất cả" allowClear options={[{ label: 'Success', value: 'success' }, { label: 'Failure', value: 'failure' }]} onChange={(value) => updateFilter('outcome', value ?? '')} /></div>
            <div className="cloud-feature-filter-field"><label htmlFor="cloud-audit-from">Từ ngày</label><Input id="cloud-audit-from" type="datetime-local" value={filters.from} onChange={(event) => updateFilter('from', event.target.value)} /></div>
            <div className="cloud-feature-filter-field"><label htmlFor="cloud-audit-to">Đến ngày</label><Input id="cloud-audit-to" type="datetime-local" value={filters.to} onChange={(event) => updateFilter('to', event.target.value)} /></div>
            <div className="cloud-feature-filter-field"><label htmlFor="cloud-audit-order">Thứ tự</label><Select id="cloud-audit-order" value={filters.sortOrder} options={[{ label: 'Mới nhất', value: 'desc' }, { label: 'Cũ nhất', value: 'asc' }]} onChange={(value) => updateFilter('sortOrder', value)} /></div>
            <div className="cloud-feature-filter-actions"><Button onClick={() => { setFilters(initialFilters); pagination.reset(); }}>Đặt lại</Button></div>
          </div>
        </FilterBar>
        <DataTableShell
          title="Nhật ký Cloud audit"
          meta="Metadata được server mask và bounded; Panel không hiển thị credential hoặc raw upstream response."
          loading={query.isFetching && !query.isPending}
          footer={<CloudCursorPagination page={pagination.page} pageSize={pagination.pageSize} hasNextPage={Boolean(data.nextCursor)} loading={query.isFetching} onPrevious={pagination.goPrevious} onNext={pagination.goNext} onPageSizeChange={(value) => pagination.reset(value)} />}
        >
          <DataTable<CloudAuditEvent> rowKey="auditId" columns={columns} dataSource={data.items} pagination={false} minHeight={420} emptyNode={<EmptyState title="Chưa có audit event" description="Không có audit event phù hợp với bộ lọc." />} onRow={(record) => ({ onClick: () => setSelectedEvent(record), style: { cursor: 'pointer' } })} />
        </DataTableShell>
      </div>

      <AppDrawer open={Boolean(selectedEvent)} title="Chi tiết Cloud audit" onClose={() => setSelectedEvent(null)} width={640}>
        {selectedEvent ? (
          <>
            <div className="cloud-feature-detail-section">
              <h3>Định danh và trace</h3>
              <div className="cloud-feature-field-grid">
                <CloudField label="Audit ID" value={renderId(selectedEvent.auditId, 'audit ID')} />
                <CloudField label="Actor ID" value={renderId(selectedEvent.actorId, 'actor ID')} />
                <CloudField label="Request ID" value={renderId(selectedEvent.requestId, 'request ID')} />
                <CloudField label="Operation ID" value={renderId(selectedEvent.operationId, 'operation ID')} />
              </div>
            </div>
            <div className="cloud-feature-detail-section">
              <h3>Thao tác</h3>
              <div className="cloud-feature-field-grid">
                <CloudField label="Action" value={selectedEvent.action} />
                <CloudField label="Resource type" value={selectedEvent.resourceType} />
                <CloudField label="Resource ID" value={selectedEvent.resourceId} />
                <CloudField label="Kết quả" value={<StatusBadge status={selectedEvent.outcome} />} />
                <CloudField label="Tạo lúc" value={<DateTimeCell value={selectedEvent.createdAt} relative={false} />} />
              </div>
            </div>
            <div className="cloud-feature-detail-section">
              <h3>Metadata đã mask</h3>
              <pre className="cloud-feature-json">{JSON.stringify(sanitizeMetadata(selectedEvent.metadata), null, 2)}</pre>
            </div>
          </>
        ) : null}
      </AppDrawer>
    </PageShell>
  );
};
