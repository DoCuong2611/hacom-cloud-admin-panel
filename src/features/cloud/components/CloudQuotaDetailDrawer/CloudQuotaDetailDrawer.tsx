import { Button, Space, Typography } from 'antd';

import { AppDrawer } from '@/components/AppDrawer/AppDrawer';
import { DateTimeCell } from '@/components/DateTimeCell/DateTimeCell';
import { MetaCell } from '@/components/MetaCell/MetaCell';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import { formatBytes } from '@/utils/formatters/formatters';

import type {
  CloudQuotaRequest,
  CloudQuotaReviewAction,
} from '../../types/cloudQuotaTypes';
import { getQuotaRequester, getQuotaUserPrimary, getQuotaUserSecondary } from '../../utils/cloudQuotaUser';

interface CloudQuotaDetailDrawerProps {
  open: boolean;
  request: CloudQuotaRequest | null;
  onClose: () => void;
  onReview: (action: CloudQuotaReviewAction) => void;
}

const Fact = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="cloud-quota-detail-fact">
    <dt>{label}</dt>
    <dd>{children}</dd>
  </div>
);

export const CloudQuotaDetailDrawer = ({
  open,
  request,
  onClose,
  onReview,
}: CloudQuotaDetailDrawerProps) => {
  if (!request) {
    return null;
  }

  const canReview = request.status === 'pending';
  const requester = getQuotaRequester(request);
  const requesterId = requester?.userId ?? request.ownerUserId;

  return (
    <AppDrawer
      open={open}
      title="Chi tiết quota request"
      onClose={onClose}
      width={540}
      footer={
        canReview ? (
          <Space>
            <Button danger onClick={() => onReview('reject')}>
              Từ chối
            </Button>
            <Button type="primary" onClick={() => onReview('approve')}>
              Duyệt
            </Button>
          </Space>
        ) : undefined
      }
    >
      <div className="cloud-quota-detail-stack">
        <div className="cloud-quota-detail-heading">
          <div>
            <Typography.Text type="secondary">Request ID</Typography.Text>
            <Typography.Text copyable={{ text: request.id }} code>
              {request.id}
            </Typography.Text>
          </div>
          <StatusBadge status={request.status} showIcon />
        </div>

        <dl className="cloud-quota-detail-facts">
          <Fact label="Người yêu cầu">
            <MetaCell
              primary={getQuotaUserPrimary(requester, requesterId)}
              secondary={getQuotaUserSecondary(requester)}
            />
          </Fact>
          <Fact label="Requester user ID">
            <Typography.Text copyable={{ text: requesterId }} code>
              {requesterId}
            </Typography.Text>
          </Fact>
          <Fact label="Owner user ID">
            <Typography.Text copyable={{ text: request.ownerUserId }} code>
              {request.ownerUserId}
            </Typography.Text>
          </Fact>
          <Fact label="Quota hiện tại">{formatBytes(request.currentQuotaBytes)}</Fact>
          <Fact label="Quota yêu cầu">{formatBytes(request.requestedQuotaBytes)}</Fact>
          <Fact label="Quota đang áp dụng">{formatBytes(request.quotaBytes)}</Fact>
          <Fact label="Đã sử dụng">{formatBytes(request.usedBytes)}</Fact>
          <Fact label="Đã reserved">{formatBytes(request.reservedBytes)}</Fact>
          <Fact label="Trash">{formatBytes(request.trashBytes)}</Fact>
          <Fact label="Tạo lúc">
            <DateTimeCell value={request.createdAt} relative={false} />
          </Fact>
          <Fact label="Cập nhật lúc">
            <DateTimeCell value={request.updatedAt} relative={false} />
          </Fact>
          {request.reviewedByUserId ? (
            <Fact label="Người xử lý">{request.reviewedByUserId}</Fact>
          ) : null}
          {request.reviewedAt ? (
            <Fact label="Xử lý lúc">
              <DateTimeCell value={request.reviewedAt} relative={false} />
            </Fact>
          ) : null}
        </dl>

        <section className="cloud-quota-detail-section">
          <Typography.Title level={5}>Lý do yêu cầu</Typography.Title>
          <Typography.Paragraph>{request.reason || 'Không có lý do được trả về.'}</Typography.Paragraph>
        </section>

        {request.reviewNote ? (
          <section className="cloud-quota-detail-section">
            <Typography.Title level={5}>Ghi chú xử lý</Typography.Title>
            <Typography.Paragraph>{request.reviewNote}</Typography.Paragraph>
          </section>
        ) : null}
      </div>
    </AppDrawer>
  );
};
