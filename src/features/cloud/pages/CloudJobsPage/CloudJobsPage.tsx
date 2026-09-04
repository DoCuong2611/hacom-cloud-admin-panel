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
import { formatNumber } from '@/utils/formatters/formatters';

import { CloudCursorPagination } from '../../components/CloudCursorPagination/CloudCursorPagination';
import { CloudFeatureErrorState, CloudField } from '../../components/CloudFeatureState/CloudFeatureState';
import { useCloudCursorPagination } from '../../hooks/useCloudCursorPagination';
import { useCloudJobDetail } from '../../hooks/useCloudJobDetail';
import { useCloudJobs } from '../../hooks/useCloudOperationalQueries';
import type { CloudJob, CloudJobStatus, CloudJobsApi } from '../../types/cloudOperationalTypes';
import { createCloudIdempotencyKey } from '../../utils/cloudMutation';
import '../../styles/cloudFeature.css';
import { CloudApiModeBanner } from '../../components/CloudApiModeBanner/CloudApiModeBanner';

const DEFAULT_PAGE_SIZE = 25;

interface CloudJobsPageProps {
  api: CloudJobsApi;
}

interface JobFilters {
  status: CloudJobStatus | '';
  type: string;
  resourceType: string;
  sortBy: 'createdAt' | 'updatedAt' | 'nextRetryAt';
  sortOrder: 'asc' | 'desc';
}

const initialFilters: JobFilters = {
  status: '',
  type: '',
  resourceType: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

const jobStatusLabels: Record<CloudJobStatus, string> = {
  queued: 'Đang xếp hàng',
  running: 'Đang chạy',
  succeeded: 'Thành công',
  failed: 'Thất bại',
  dead: 'Dead job',
  cancelled: 'Đã hủy',
};

const actionLabels = { retry: 'Thử lại', cancel: 'Hủy job' } as const;

const actionAllowed = (job: CloudJob, action: 'retry' | 'cancel') =>
  action === 'retry' ? job.status === 'failed' || job.status === 'dead' : job.status === 'queued' || job.status === 'running';

export const CloudJobsPage = ({ api }: CloudJobsPageProps) => {
  const [filters, setFilters] = useState<JobFilters>(initialFilters);
  const [selectedJob, setSelectedJob] = useState<CloudJob | null>(null);
  const [action, setAction] = useState<'retry' | 'cancel' | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const pagination = useCloudCursorPagination({ defaultPageSize: DEFAULT_PAGE_SIZE });
  const params = useMemo(
    () => ({
      status: filters.status || undefined,
      type: filters.type || undefined,
      resourceType: filters.resourceType || undefined,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      limit: pagination.pageSize,
      cursor: pagination.cursor,
    }),
    [filters, pagination.cursor, pagination.pageSize],
  );
  const { query, mutation } = useCloudJobs(api, params);
  const detailQuery = useCloudJobDetail(api, selectedJob?.jobId);

  const setNextCursor = pagination.setNextCursor;

  useEffect(() => {
    setNextCursor(query.data?.nextCursor ?? null);
  }, [setNextCursor, query.data?.nextCursor]);

  const updateFilter = (key: keyof JobFilters, value: string) => {
    setFilters((previous) => ({ ...previous, [key]: value } as JobFilters));
    pagination.reset();
  };

  const openAction = useCallback((nextAction: 'retry' | 'cancel', job: CloudJob) => {
    if (!actionAllowed(job, nextAction)) {
      return;
    }

    setSelectedJob(job);
    setAction(nextAction);
    setIdempotencyKey(createCloudIdempotencyKey(`cloud-job-${nextAction}-${job.jobId}`));
    mutation.reset();
  }, [mutation]);

  const closeAction = () => {
    if (mutation.isPending) {
      return;
    }

    setAction(null);
    setIdempotencyKey(null);
    mutation.reset();
  };

  const submitAction = async () => {
    if (!selectedJob || !action || !idempotencyKey) {
      return;
    }

    try {
      const result = await mutation.mutateAsync({
        action,
        jobId: selectedJob.jobId,
        payload: { idempotencyKey },
      });
      const replaySuffix = result.applied === false ? ' Kết quả này đã được áp dụng trước đó.' : '';
      setSuccessMessage(`${actionLabels[action]} ${selectedJob.jobId} thành công.${replaySuffix}`);
      setSelectedJob(null);
      setAction(null);
      setIdempotencyKey(null);
      pagination.reset();
    } catch {
      // The error remains in the modal and the same key is used for retry.
    }
  };

  const columns = useMemo<ColumnsType<CloudJob>>(
    () => [
      {
        title: 'Job ID',
        dataIndex: 'jobId',
        key: 'jobId',
        width: 210,
        render: (value: string) => (
          <MetaCell
            primary={
              <span>
                <Typography.Text code className="cloud-feature-code" title={value}>{value}</Typography.Text>
                <CopyButton text={value} iconOnly tooltipText="Sao chép mã job" />
              </span>
            }
          />
        ),
      },
      { title: 'Loại', dataIndex: 'type', key: 'type', width: 150, ellipsis: true },
      { title: 'Trạng thái', dataIndex: 'status', key: 'status', width: 150, render: (value: CloudJobStatus) => <StatusBadge status={jobStatusLabels[value]} /> },
      { title: 'Resource', dataIndex: 'resourceType', key: 'resourceType', width: 140, render: (value: string, record) => <MetaCell primary={value} secondary={record.resourceId} /> },
      { title: 'Attempts', dataIndex: 'attempts', key: 'attempts', width: 100, render: (value: number, record) => `${formatNumber(value)} / ${formatNumber(record.maxAttempts)}` },
      { title: 'Tạo lúc', dataIndex: 'createdAt', key: 'createdAt', width: 180, render: (value: string) => <DateTimeCell value={value} /> },
      { title: 'Retry tiếp theo', dataIndex: 'nextRetryAt', key: 'nextRetryAt', width: 180, render: (value: string | null) => <DateTimeCell value={value} /> },
      {
        title: 'Thao tác',
        key: 'actions',
        fixed: 'right',
        width: 170,
        render: (_, record) => (
          <div>
            <Button type="link" onClick={(event) => { event.stopPropagation(); setSelectedJob(record); }}>Chi tiết</Button>
            {actionAllowed(record, 'retry') ? <Button type="link" onClick={(event) => { event.stopPropagation(); openAction('retry', record); }}>Thử lại</Button> : null}
            {actionAllowed(record, 'cancel') ? <Button type="link" danger onClick={(event) => { event.stopPropagation(); openAction('cancel', record); }}>Hủy</Button> : null}
          </div>
        ),
      },
    ],
    [openAction],
  );

  if (query.isPending && !query.data) {
    return <PageShell eyebrow="Hacom Cloud" title="Worker jobs" description="Theo dõi bounded jobs và dead jobs từ Cloud."><QueryStateView kind="loading" title="Đang tải worker jobs..." /></PageShell>;
  }

  if (query.isError && !query.data) {
    return <PageShell eyebrow="Hacom Cloud" title="Worker jobs" description="Theo dõi bounded jobs và dead jobs từ Cloud."><CloudFeatureErrorState error={query.error} onRetry={() => void query.refetch()} retrying={query.isFetching} /></PageShell>;
  }

  const data = query.data;

  if (!data) {
    return null;
  }

  const detailJob = detailQuery.data ?? selectedJob;

  return (
    <PageShell
      eyebrow="Hacom Cloud"
      title="Worker jobs"
      description="Chỉ retry/cancel theo trạng thái được contract cho phép; backend vẫn là nơi enforce cuối cùng."
      isRefreshing={query.isFetching}
      onRefresh={() => void query.refetch()}
      headerExtra={<Button loading={query.isFetching} onClick={() => void query.refetch()}>Làm mới</Button>}
    >
              <CloudApiModeBanner />
        <div className="cloud-feature-page-stack">
        {successMessage ? <div className="cloud-feature-success" role="status"><Typography.Text>{successMessage}</Typography.Text><Button type="link" onClick={() => setSuccessMessage(null)}>Đóng</Button></div> : null}
        {query.isError ? <CloudFeatureErrorState error={query.error} compact onRetry={() => void query.refetch()} retrying={query.isFetching} /> : null}
        <FilterBar className="cloud-feature-filter-bar">
          <div className="cloud-feature-filter-row">
            <div className="cloud-feature-filter-field">
              <label htmlFor="cloud-job-status">Trạng thái</label>
              <Select id="cloud-job-status" value={filters.status || undefined} placeholder="Tất cả" allowClear options={Object.entries(jobStatusLabels).map(([value, label]) => ({ value, label }))} onChange={(value) => updateFilter('status', value ?? '')} />
            </div>
            <div className="cloud-feature-filter-field cloud-feature-filter-field--wide">
              <label htmlFor="cloud-job-type">Loại job</label>
              <Input id="cloud-job-type" value={filters.type} allowClear onChange={(event) => updateFilter('type', event.target.value)} />
            </div>
            <div className="cloud-feature-filter-field">
              <label htmlFor="cloud-job-resource">Resource type</label>
              <Input id="cloud-job-resource" value={filters.resourceType} allowClear onChange={(event) => updateFilter('resourceType', event.target.value)} />
            </div>
            <div className="cloud-feature-filter-field">
              <label htmlFor="cloud-job-sort">Sắp xếp</label>
              <Select id="cloud-job-sort" value={filters.sortBy} options={[{ label: 'Tạo lúc', value: 'createdAt' }, { label: 'Cập nhật', value: 'updatedAt' }, { label: 'Retry tiếp theo', value: 'nextRetryAt' }]} onChange={(value) => updateFilter('sortBy', value)} />
            </div>
            <div className="cloud-feature-filter-field">
              <label htmlFor="cloud-job-order">Thứ tự</label>
              <Select id="cloud-job-order" value={filters.sortOrder} options={[{ label: 'Giảm dần', value: 'desc' }, { label: 'Tăng dần', value: 'asc' }]} onChange={(value) => updateFilter('sortOrder', value)} />
            </div>
            <div className="cloud-feature-filter-actions"><Button onClick={() => { setFilters(initialFilters); pagination.reset(); }}>Đặt lại</Button></div>
          </div>
        </FilterBar>
        <DataTableShell
          title="Danh sách worker jobs"
          meta="Job detail không hiển thị raw payload, stack trace, secret hoặc object key."
          loading={query.isFetching && !query.isPending}
          footer={<CloudCursorPagination page={pagination.page} pageSize={pagination.pageSize} hasNextPage={Boolean(data.nextCursor)} loading={query.isFetching} onPrevious={pagination.goPrevious} onNext={pagination.goNext} onPageSizeChange={(value) => pagination.reset(value)} />}
        >
          <DataTable<CloudJob> rowKey="jobId" columns={columns} dataSource={data.items} pagination={false} minHeight={420} emptyNode={<EmptyState title="Không có worker job" description="Không có job phù hợp với bộ lọc." />} onRow={(record) => ({ onClick: () => setSelectedJob(record), style: { cursor: 'pointer' } })} />
        </DataTableShell>
      </div>

      <AppDrawer open={Boolean(selectedJob) && !action} title="Chi tiết worker job" onClose={() => setSelectedJob(null)} width={620}>
        {detailJob ? (
          <>
            {detailQuery.isError ? <CloudFeatureErrorState error={detailQuery.error} compact onRetry={() => void detailQuery.refetch()} retrying={detailQuery.isFetching} /> : null}
            <div className="cloud-feature-detail-section">
              <h3>Job</h3>
              <div className="cloud-feature-field-grid">
                <CloudField label="Job ID" value={detailJob.jobId} />
                <CloudField label="Loại" value={detailJob.type} />
                <CloudField label="Trạng thái" value={<StatusBadge status={jobStatusLabels[detailJob.status]} />} />
                <CloudField label="Attempts" value={`${detailJob.attempts} / ${detailJob.maxAttempts}`} />
              </div>
            </div>
            <div className="cloud-feature-detail-section">
              <h3>Resource và thời gian</h3>
              <div className="cloud-feature-field-grid">
                <CloudField label="Resource type" value={detailJob.resourceType} />
                <CloudField label="Resource ID" value={detailJob.resourceId} />
                <CloudField label="Tạo lúc" value={<DateTimeCell value={detailJob.createdAt} relative={false} />} />
                <CloudField label="Bắt đầu" value={<DateTimeCell value={detailJob.startedAt} relative={false} />} />
                <CloudField label="Kết thúc" value={<DateTimeCell value={detailJob.finishedAt} relative={false} />} />
                <CloudField label="Retry tiếp theo" value={<DateTimeCell value={detailJob.nextRetryAt} relative={false} />} />
              </div>
            </div>
            {detailJob.lastErrorCode ? <Typography.Text type="danger">Mã lỗi cuối: {detailJob.lastErrorCode}</Typography.Text> : null}
            <div className="cloud-feature-filter-actions">
              {actionAllowed(detailJob, 'retry') ? <Button onClick={() => openAction('retry', detailJob)}>Thử lại</Button> : null}
              {actionAllowed(detailJob, 'cancel') ? <Button danger onClick={() => openAction('cancel', detailJob)}>Hủy job</Button> : null}
            </div>
          </>
        ) : null}
      </AppDrawer>

      <AppModal open={Boolean(action) && Boolean(selectedJob)} title={action ? `${actionLabels[action]} worker job` : undefined} onClose={closeAction} footer={<><Button onClick={closeAction} disabled={mutation.isPending}>Hủy</Button><Button type="primary" danger={action === 'cancel'} loading={mutation.isPending} onClick={() => void submitAction()}>Xác nhận</Button></>}>
        {selectedJob && action ? (
          <div className="cloud-feature-page-stack">
            <Typography.Paragraph>Backend sẽ kiểm tra lại trạng thái job trước khi thực hiện. Retry cùng ý định phải dùng lại Idempotency-Key.</Typography.Paragraph>
            <div className="cloud-feature-modal-summary"><CloudField label="Job ID" value={selectedJob.jobId} /><CloudField label="Thao tác" value={actionLabels[action]} /></div>
            {mutation.isError ? <CloudFeatureErrorState error={mutation.error} compact /> : null}
          </div>
        ) : null}
      </AppModal>
    </PageShell>
  );
};
