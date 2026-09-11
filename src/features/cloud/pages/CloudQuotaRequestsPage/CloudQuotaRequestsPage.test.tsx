import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AxiosError } from 'axios';
import type { AxiosResponse } from 'axios';
import type * as AntdModule from 'antd';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

vi.mock('antd', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof AntdModule;
  const MockOverlay = ({
    open,
    title,
    children,
    footer,
  }: {
    open?: boolean;
    title?: ReactNode;
    children?: ReactNode;
    footer?: ReactNode;
  }) =>
    open ? (
      <div role="dialog" aria-label={typeof title === 'string' ? title : undefined}>
        {title ? <h2>{title}</h2> : null}
        {children}
        {footer ? <div>{footer}</div> : null}
      </div>
    ) : null;

  return {
    ...actual,
    Modal: MockOverlay,
    Drawer: MockOverlay,
  };
});


import type {
  CloudQuotaRequest,
  CloudQuotaReviewApi,
} from '../../types/cloudQuotaTypes';
import { CloudQuotaRequestsPage } from './CloudQuotaRequestsPage';

const baseRequest: CloudQuotaRequest = {
  id: 'quota-request-1',
  ownerUserId: 'user-1',
  requestedByUserId: 'user-1',
  owner: { userId: 'user-1', username: 'demo.user', displayName: 'Demo User', email: 'demo@example.test' },
  requestedBy: { userId: 'user-1', username: 'demo.user', displayName: 'Demo User', email: 'demo@example.test' },
  status: 'pending',
  currentQuotaBytes: 5_000_000_000,
  requestedQuotaBytes: 10_000_000_000,
  quotaBytes: 5_000_000_000,
  usedBytes: 1_200_000,
  reservedBytes: 0,
  trashBytes: 0,
  reason: 'Cần thêm dung lượng cho bộ phận kinh doanh.',
  createdAt: '2026-08-25T00:00:00.000Z',
  updatedAt: '2026-08-25T00:00:00.000Z',
};

const createApi = (): CloudQuotaReviewApi => ({
  list: vi.fn(),
  approve: vi.fn(),
  reject: vi.fn(),
});

const renderPage = (api: CloudQuotaReviewApi) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <CloudQuotaRequestsPage api={api} />
    </QueryClientProvider>,
  );
};

describe('CloudQuotaRequestsPage', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('renders the loading state before the first response', () => {
    const api = createApi();
    api.list.mockImplementation(() => new Promise(() => undefined));

    renderPage(api);

    expect(screen.getByText('Đang tải danh sách quota...')).toBeInTheDocument();
  });

  it('renders quota rows and opens the detail drawer', async () => {
    const api = createApi();
    api.list.mockResolvedValue({ items: [baseRequest], nextCursor: null });

    renderPage(api);

    expect(await screen.findByText('quota-request-1')).toBeInTheDocument();
    expect(screen.getByText('Demo User')).toBeInTheDocument();
    expect(screen.getByText('@demo.user · demo@example.test')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Xem chi tiết quota-request-1' }));

    expect(await screen.findByText('Chi tiết quota request')).toBeInTheDocument();
    expect(screen.getByText('Cần thêm dung lượng cho bộ phận kinh doanh.')).toBeInTheDocument();
    expect(screen.getAllByText('user-1').length).toBeGreaterThanOrEqual(2);
  });

  it('renders the empty state without inventing a total count', async () => {
    const api = createApi();
    api.list.mockResolvedValue({ items: [], nextCursor: null });

    renderPage(api);

    expect(await screen.findByText('Không có quota request')).toBeInTheDocument();
    expect(screen.getByText('Trang 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tiếp' })).toBeDisabled();
  });

  it('changes status and follows cursor pagination through the API contract', async () => {
    const api = createApi();
    api.list.mockResolvedValue({ items: [baseRequest], nextCursor: 'cursor-page-2' });

    renderPage(api);
    await screen.findByText('quota-request-1');

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Trạng thái quota' }));
    fireEvent.click((await screen.findAllByText('Đã duyệt')).at(-1)!);

    await waitFor(() => {
      expect(api.list).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: 'approved', limit: 25 }),
      );
    });

    await waitFor(() => expect(screen.getByRole('button', { name: 'Tiếp' })).not.toBeDisabled());
    fireEvent.click(screen.getByRole('button', { name: 'Tiếp' }));
    await waitFor(() => {
      expect(api.list).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: 'approved', cursor: 'cursor-page-2', limit: 25 }),
      );
    });
  });

  it('keeps the same idempotency key when an approve is retried', async () => {
    const api = createApi();
    api.list.mockResolvedValue({ items: [baseRequest], nextCursor: null });
    api.approve
      .mockRejectedValueOnce(new Error('Mạng upstream tạm thời gián đoạn.'))
      .mockResolvedValueOnce({ ...baseRequest, status: 'approved', applied: true });

    renderPage(api);
    await screen.findByText('quota-request-1');
    fireEvent.click(screen.getByRole('button', { name: 'Xem chi tiết quota-request-1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Duyệt' }));

    fireEvent.change(screen.getByPlaceholderText('Ghi rõ căn cứ duyệt hoặc từ chối...'), {
      target: { value: 'Đã kiểm tra nhu cầu.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận duyệt' }));

    await waitFor(() => expect(api.approve).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('Mạng upstream tạm thời gián đoạn.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận duyệt' }));

    await waitFor(() => expect(api.approve).toHaveBeenCalledTimes(2));
    const firstPayload = api.approve.mock.calls[0]?.[1];
    const retryPayload = api.approve.mock.calls[1]?.[1];
    expect(firstPayload?.idempotencyKey).toBeTruthy();
    expect(retryPayload?.idempotencyKey).toBe(firstPayload?.idempotencyKey);
    expect(firstPayload?.note).toBe('Đã kiểm tra nhu cầu.');
    expect(await screen.findByRole('status')).toHaveTextContent('Duyệt quota request quota-request-1 thành công.');
  });

  it('exposes forbidden errors with the backend request ID', async () => {
    const api = createApi();
    const response: AxiosResponse = {
      data: {
        success: false,
        error: { code: 'FORBIDDEN', message: 'Cloud permission missing.' },
        meta: { requestId: 'request-forbidden-1' },
      },
      status: 403,
      statusText: 'Forbidden',
      headers: {},
      config: {} as AxiosResponse['config'],
    };
    api.list.mockRejectedValue(new AxiosError('forbidden', undefined, undefined, undefined, response));

    renderPage(api);

    expect(await screen.findByText('Bạn không có quyền xem quota request')).toBeInTheDocument();
    expect(screen.getByText('Request ID: request-forbidden-1')).toBeInTheDocument();
  });
});
