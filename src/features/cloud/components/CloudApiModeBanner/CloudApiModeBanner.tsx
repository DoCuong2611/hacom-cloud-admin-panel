import { Alert } from 'antd';

const isFixtureMode = import.meta.env.VITE_CLOUD_API_MODE?.trim().toLowerCase() === 'fixture';

export const CloudApiModeBanner = () =>
  isFixtureMode ? (
    <Alert
      type="warning"
      showIcon
      title="Đang dùng dữ liệu mẫu local (fixture)"
      description="Các trang Cloud hiện đang dùng fixture trong frontend, không đọc dữ liệu thật từ PostgreSQL/MinIO. Các thao tác chỉ tồn tại trong phiên trình duyệt; đặt VITE_CLOUD_API_MODE=live để gọi Cloud API thật."
      className="cloud-feature-mode-banner"
    />
  ) : null;
