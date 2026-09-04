import { Alert } from 'antd';

const isFixtureMode = import.meta.env.VITE_CLOUD_API_MODE?.trim().toLowerCase() === 'fixture';

export const CloudApiModeBanner = () =>
  isFixtureMode ? (
    <Alert
      type="warning"
      showIcon
      title="Đang dùng dữ liệu mẫu local"
      description="Backend Cloud Admin chưa được triển khai. Các thao tác trên trang này chỉ phục vụ kiểm tra giao diện."
      className="cloud-feature-mode-banner"
    />
  ) : null;
