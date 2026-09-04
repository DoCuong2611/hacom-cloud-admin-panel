import { Alert, Button, Result, Space, Typography } from 'antd';

import {
  getCloudQuotaErrorInfo,
  getCloudQuotaErrorTitle,
  getCloudQuotaErrorType,
} from '../../utils/cloudQuotaErrors';

interface CloudQuotaErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  retrying?: boolean;
  compact?: boolean;
}

const ErrorMetadata = ({ error }: { error: unknown }) => {
  const info = getCloudQuotaErrorInfo(error);

  return (
    <Space direction="vertical" size={4}>
      <Typography.Text>{info.message}</Typography.Text>
      {info.code ? <Typography.Text type="secondary">Mã lỗi: {info.code}</Typography.Text> : null}
      {info.requestId ? (
        <Typography.Text type="secondary">Request ID: {info.requestId}</Typography.Text>
      ) : null}
    </Space>
  );
};

export const CloudQuotaErrorState = ({
  error,
  onRetry,
  retrying = false,
  compact = false,
}: CloudQuotaErrorStateProps) => {
  const info = getCloudQuotaErrorInfo(error);
  const title = getCloudQuotaErrorTitle(info.kind);

  if (compact) {
    return (
      <Alert
        type={getCloudQuotaErrorType(info.kind)}
        showIcon
        title={title}
        description={
          <Space direction="vertical" size={8}>
            <ErrorMetadata error={error} />
            {onRetry ? (
              <Button size="small" onClick={onRetry} loading={retrying}>
                Thử lại
              </Button>
            ) : null}
          </Space>
        }
      />
    );
  }

  if (info.kind === 'forbidden') {
    return (
      <Result
        status="403"
        title={title}
        subTitle={<ErrorMetadata error={error} />}
        extra={
          onRetry ? (
            <Button onClick={onRetry} loading={retrying}>
              Thử lại
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <Result
      status="error"
      title={title}
      subTitle={<ErrorMetadata error={error} />}
      extra={
        onRetry ? (
          <Button onClick={onRetry} loading={retrying}>
            Thử lại
          </Button>
        ) : undefined
      }
    />
  );
};
