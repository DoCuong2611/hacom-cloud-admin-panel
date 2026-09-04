import { Alert, Button, Typography } from 'antd';
import type { ReactNode } from 'react';

import {
  getCloudFeatureErrorInfo,
  getCloudFeatureErrorRequestId,
  getCloudFeatureErrorTitle,
} from '../../utils/cloudFeatureErrors';

interface CloudFeatureErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  retrying?: boolean;
  compact?: boolean;
}

export const CloudFeatureErrorState = ({
  error,
  onRetry,
  retrying = false,
  compact = false,
}: CloudFeatureErrorStateProps) => {
  const info = getCloudFeatureErrorInfo(error);
  const requestId = getCloudFeatureErrorRequestId(error);
  const description = (
    <div className="cloud-feature-error-copy">
      <Typography.Text>{info.message}</Typography.Text>
      {info.code ? <Typography.Text type="secondary">Mã lỗi: {info.code}</Typography.Text> : null}
      {requestId ? (
        <Typography.Text type="secondary">Request ID: {requestId}</Typography.Text>
      ) : null}
    </div>
  );

  return (
    <Alert
      className={compact ? 'cloud-feature-error cloud-feature-error--compact' : 'cloud-feature-error'}
      type={info.kind === 'pending-access' || info.kind === 'rate-limited' ? 'warning' : 'error'}
      showIcon
      title={getCloudFeatureErrorTitle(info.kind)}
      description={description}
      action={
        onRetry ? (
          <Button size="small" onClick={onRetry} loading={retrying}>
            Thử lại
          </Button>
        ) : undefined
      }
    />
  );
};

export interface CloudFieldProps {
  label: string;
  value: ReactNode;
}

export const CloudField = ({ label, value }: CloudFieldProps) => (
  <div className="cloud-feature-field">
    <span>{label}</span>
    <strong>{value === null || value === undefined ? '-' : value}</strong>
  </div>
);
