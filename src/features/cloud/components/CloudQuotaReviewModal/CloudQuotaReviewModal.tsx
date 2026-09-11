import { Button, Input, Modal, Space, Typography } from 'antd';
import { useEffect, useState } from 'react';

import type {
  CloudQuotaRequest,
  CloudQuotaReviewAction,
} from '../../types/cloudQuotaTypes';
import { getQuotaRequester, getQuotaUserPrimary, getQuotaUserSecondary } from '../../utils/cloudQuotaUser';
import { CloudQuotaErrorState } from '../CloudQuotaErrorState/CloudQuotaErrorState';

interface CloudQuotaReviewModalProps {
  open: boolean;
  request: CloudQuotaRequest | null;
  action: CloudQuotaReviewAction | null;
  error?: unknown;
  loading?: boolean;
  onCancel: () => void;
  onSubmit: (note: string) => void;
}

const actionCopy: Record<CloudQuotaReviewAction, { title: string; confirm: string; verb: string }> = {
  approve: {
    title: 'Duyệt quota request',
    confirm: 'Xác nhận duyệt',
    verb: 'duyệt',
  },
  reject: {
    title: 'Từ chối quota request',
    confirm: 'Xác nhận từ chối',
    verb: 'từ chối',
  },
};

export const CloudQuotaReviewModal = ({
  open,
  request,
  action,
  error,
  loading = false,
  onCancel,
  onSubmit,
}: CloudQuotaReviewModalProps) => {
  const [note, setNote] = useState('');
  const copy = action ? actionCopy[action] : actionCopy.approve;
  const requester = request ? getQuotaRequester(request) : undefined;

  useEffect(() => {
    if (open) {
      setNote('');
    }
  }, [open, request?.id, action]);

  if (!request || !action) {
    return null;
  }

  return (
    <Modal
      open={open}
      title={copy.title}
      onCancel={onCancel}
      maskClosable={false}
      destroyOnHidden
      footer={[
        <Button key="cancel" onClick={onCancel} disabled={loading}>
          Hủy
        </Button>,
        <Button
          key="submit"
          type="primary"
          danger={action === 'reject'}
          loading={loading}
          onClick={() => onSubmit(note.trim())}
        >
          {copy.confirm}
        </Button>,
      ]}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Typography.Paragraph>
          Bạn đang {copy.verb} yêu cầu của người dùng{' '}
          <Typography.Text strong>{getQuotaUserPrimary(requester, request.ownerUserId)}</Typography.Text>
          {getQuotaUserSecondary(requester) ? ` (${getQuotaUserSecondary(requester)})` : ''}.
          Kiểm tra quota hiện tại và mức quota yêu cầu trước khi xác nhận.
        </Typography.Paragraph>

        <div className="cloud-quota-review-summary">
          <div>
            <span>Quota hiện tại</span>
            <strong>{request.currentQuotaBytes.toLocaleString('vi-VN')} byte</strong>
          </div>
          <div>
            <span>Quota yêu cầu</span>
            <strong>{request.requestedQuotaBytes.toLocaleString('vi-VN')} byte</strong>
          </div>
        </div>

        {error ? <CloudQuotaErrorState error={error} compact /> : null}

        <label htmlFor="cloud-quota-review-note">
          <Typography.Text strong>Ghi chú</Typography.Text>
          <Typography.Text type="secondary"> (tùy chọn)</Typography.Text>
        </label>
        <Input.TextArea
          id="cloud-quota-review-note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Ghi rõ căn cứ duyệt hoặc từ chối..."
          autoSize={{ minRows: 4, maxRows: 8 }}
          disabled={loading}
        />
      </Space>
    </Modal>
  );
};
