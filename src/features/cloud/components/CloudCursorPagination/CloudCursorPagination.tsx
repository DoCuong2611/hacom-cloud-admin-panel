import { Button, Select, Typography } from 'antd';

interface CloudCursorPaginationProps {
  page: number;
  pageSize: number;
  hasNextPage: boolean;
  loading?: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onPageSizeChange: (value: number) => void;
}

export const CloudCursorPagination = ({
  page,
  pageSize,
  hasNextPage,
  loading = false,
  onPrevious,
  onNext,
  onPageSizeChange,
}: CloudCursorPaginationProps) => (
  <div className="cloud-feature-pagination" aria-label="Phân trang dữ liệu Cloud">
    <Button onClick={onPrevious} disabled={page === 1 || loading}>
      Trước
    </Button>
    <Typography.Text>Trang {page}</Typography.Text>
    <Button onClick={onNext} disabled={!hasNextPage || loading}>
      Tiếp
    </Button>
    <Select
      aria-label="Số dòng mỗi trang"
      value={pageSize}
      options={[10, 25, 50, 100].map((value) => ({ label: `${value}/trang`, value }))}
      onChange={onPageSizeChange}
    />
  </div>
);
