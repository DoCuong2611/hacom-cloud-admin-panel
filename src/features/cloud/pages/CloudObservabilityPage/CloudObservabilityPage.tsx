import { Alert, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo } from 'react';

import { DataTableShell } from '@/components/DataTableShell/DataTableShell';
import { PageShell } from '@/components/PageShell/PageShell';
import { QueryStateView } from '@/components/QueryStates/QueryStates';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import { SystemDegradedBanner } from '@/components/SystemDegradedBanner/SystemDegradedBanner';
import { DataTable } from '@/components/ui/DataTable/DataTable';
import { MetricCard } from '@/components/ui/MetricCard/MetricCard';
import { formatMs, formatNumber, formatRate } from '@/utils/formatters/formatters';
import { formatDateTime } from '@/utils/date/date';

import { CloudFeatureErrorState } from '../../components/CloudFeatureState/CloudFeatureState';
import { useCloudObservability } from '../../hooks/useCloudOperationalQueries';
import type {
  CloudObservabilityApi,
  CloudObservabilitySummary,
  CloudSourceStatus,
} from '../../types/cloudOperationalTypes';
import '../../styles/cloudFeature.css';
import { CloudApiModeBanner } from '../../components/CloudApiModeBanner/CloudApiModeBanner';

export interface CloudObservabilityPageProps {
  api: CloudObservabilityApi;
}

interface SourceRow {
  key: string;
  label: string;
  status: CloudSourceStatus;
  url?: string;
  isPubliclyAccessible?: boolean;
}

const sourceLabels: Record<string, string> = {
  prometheus: 'Prometheus',
  cloudApiMetrics: 'Cloud API metrics',
  cloudWorkerMetrics: 'Cloud worker metrics',
  grafana: 'Grafana',
};

const sourceStatusLabels: Record<CloudSourceStatus, string> = {
  available: 'Sẵn sàng',
  degraded: 'Suy giảm',
  unavailable: 'Không khả dụng',
};

const freshnessLabels: Record<CloudObservabilitySummary['freshness'], string> = {
  live: 'Trực tuyến',
  partial: 'Một phần',
  unavailable: 'Không khả dụng',
};

const isSafeExternalUrl = (value?: string): value is string => {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
};

const formatFreshnessDescription = (freshness: CloudObservabilitySummary['freshness']): string => {
  if (freshness === 'partial') {
    return 'Một hoặc nhiều nguồn giám sát đang suy giảm. Các tín hiệu thiếu dữ liệu được giữ là “-”.';
  }

  if (freshness === 'unavailable') {
    return 'Nguồn giám sát chưa khả dụng. Dữ liệu Cloud business không được suy diễn thành số 0.';
  }

  return '';
};

export const CloudObservabilityPage = ({ api }: CloudObservabilityPageProps) => {
  const query = useCloudObservability(api);

  const sourceRows = useMemo<SourceRow[]>(() => {
    const sources = query.data?.sources;

    if (!sources) {
      return [];
    }

    return [
      { key: 'prometheus', label: sourceLabels.prometheus, status: sources.prometheus },
      { key: 'cloudApiMetrics', label: sourceLabels.cloudApiMetrics, status: sources.cloudApiMetrics },
      {
        key: 'cloudWorkerMetrics',
        label: sourceLabels.cloudWorkerMetrics,
        status: sources.cloudWorkerMetrics,
      },
      {
        key: 'grafana',
        label: sourceLabels.grafana,
        status: sources.grafana.status,
        url: sources.grafana.url,
        isPubliclyAccessible: sources.grafana.isPubliclyAccessible,
      },
    ];
  }, [query.data?.sources]);

  const columns = useMemo<ColumnsType<SourceRow>>(
    () => [
      {
        title: 'Nguồn',
        dataIndex: 'label',
        key: 'label',
        width: 220,
      },
      {
        title: 'Trạng thái',
        dataIndex: 'status',
        key: 'status',
        width: 180,
        render: (status: CloudSourceStatus) => (
          <span className="cloud-feature-source-status">
            <span className={`cloud-feature-source-status__dot cloud-feature-source-status__dot--${status}`} />
            <StatusBadge status={sourceStatusLabels[status]} />
          </span>
        ),
      },
      {
        title: 'Liên kết',
        key: 'link',
        render: (_, record) =>
          record.key === 'grafana' && record.isPubliclyAccessible && isSafeExternalUrl(record.url) ? (
            <a href={record.url} target="_blank" rel="noreferrer">
              Mở dashboard
            </a>
          ) : (
            <Typography.Text type="secondary">Không có</Typography.Text>
          ),
      },
    ],
    [],
  );

  if (query.isPending && !query.data) {
    return (
      <PageShell eyebrow="Hacom Cloud" title="Giám sát Cloud" description="Tín hiệu vận hành do server cung cấp.">
        <QueryStateView kind="loading" title="Đang tải trạng thái giám sát..." />
      </PageShell>
    );
  }

  if (query.isError && !query.data) {
    return (
      <PageShell eyebrow="Hacom Cloud" title="Giám sát Cloud" description="Tín hiệu vận hành do server cung cấp.">
        <CloudFeatureErrorState error={query.error} onRetry={() => void query.refetch()} retrying={query.isFetching} />
      </PageShell>
    );
  }

  const data = query.data;

  if (!data) {
    return null;
  }

  const signalCards = [
    {
      label: 'Search P95',
      value: formatMs(data.signals.searchP95Ms),
      changeLabel: data.signals.searchP95Ms == null ? 'Chưa đủ mẫu tìm kiếm trong 5 phút' : 'Trong 5 phút gần nhất',
    },
    {
      label: 'Tốc độ quota request',
      value: formatRate(data.signals.quotaRequestRatePerMinute, '/phút'),
      changeLabel: 'Theo snapshot server',
    },
    {
      label: 'Lỗi review quota',
      value: formatRate(data.signals.reviewErrorRatePerMinute, '/phút'),
      changeLabel: 'Theo snapshot server',
    },
    {
      label: 'Dead job tăng',
      value: formatNumber(data.signals.workerDeadJobsIncrease),
      changeLabel: 'Theo snapshot server',
    },
    {
      label: 'Tốc độ retry worker',
      value: formatRate(data.signals.workerRetryRatePerMinute, '/phút'),
      changeLabel: 'Theo snapshot server',
    },
  ];

  return (
    <PageShell
      eyebrow="Hacom Cloud"
      title="Giám sát Cloud"
      description="Số liệu từ Cloud API và worker được kết nối với hệ thống giám sát. Tự cập nhật mỗi 15 giây khi mở trang."
      lastUpdated={formatDateTime(data.generatedAt)}
      isRefreshing={query.isFetching}
      onRefresh={() => void query.refetch()}
    >
              <CloudApiModeBanner />
        <div className="cloud-feature-page-stack">
        <SystemDegradedBanner
          visible={data.freshness !== 'live'}
          title={`Trạng thái giám sát: ${freshnessLabels[data.freshness]}`}
          description={formatFreshnessDescription(data.freshness)}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />

        {query.isError ? (
          <CloudFeatureErrorState
            error={query.error}
            compact
            onRetry={() => void query.refetch()}
            retrying={query.isFetching}
          />
        ) : null}

        <div className="cloud-feature-metric-grid">
          {signalCards.map((card) => (
            <MetricCard key={card.label} {...card} compact />
          ))}
        </div>

        {data.warnings.length > 0 ? (
          <Alert
            type="warning"
            showIcon
            title="Cảnh báo từ server"
            description={
              <ul>
                {data.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            }
          />
        ) : null}

        <DataTableShell
          title="Nguồn dữ liệu giám sát"
          meta={`Freshness: ${freshnessLabels[data.freshness]} · cập nhật ${formatDateTime(data.generatedAt)}`}
        >
          <DataTable<SourceRow>
            rowKey="key"
            columns={columns}
            dataSource={sourceRows}
            pagination={false}
            minHeight={220}
          />
        </DataTableShell>
      </div>
    </PageShell>
  );
};
