import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  CloudQuotaListParams,
  CloudQuotaRequestStatus,
  CloudQuotaReviewAction,
  CloudQuotaReviewApi,
  CloudQuotaReviewPayload,
} from '../types/cloudQuotaTypes';

export const cloudQuotaQueryKeys = {
  root: ['cloud-quota-requests'] as const,
  list: (params: Pick<CloudQuotaListParams, 'status' | 'limit' | 'cursor'>) =>
    ['cloud-quota-requests', params] as const,
};

export interface UseCloudQuotaRequestsOptions {
  api: CloudQuotaReviewApi;
  status: CloudQuotaRequestStatus;
  limit: number;
  cursor?: string;
}

export interface CloudQuotaReviewMutationVariables extends CloudQuotaReviewPayload {
  action: CloudQuotaReviewAction;
  requestId: string;
}

export const useCloudQuotaRequests = ({
  api,
  status,
  limit,
  cursor,
}: UseCloudQuotaRequestsOptions) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: cloudQuotaQueryKeys.list({ status, limit, cursor }),
    queryFn: ({ signal }) => api.list({ status, limit, cursor, signal }),
    placeholderData: keepPreviousData,
  });

  const reviewMutation = useMutation({
    mutationFn: ({ action, requestId, note, idempotencyKey }: CloudQuotaReviewMutationVariables) => {
      const payload: CloudQuotaReviewPayload = { idempotencyKey };
      if (note) {
        payload.note = note;
      }

      return action === 'approve'
        ? api.approve(requestId, payload)
        : api.reject(requestId, payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: cloudQuotaQueryKeys.root });
    },
  });

  return {
    query,
    reviewMutation,
  };
};
