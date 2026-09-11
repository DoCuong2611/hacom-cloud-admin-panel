import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  CloudAuditApi,
  CloudAuditListParams,
  CloudDriveListParams,
  CloudItemListParams,
  CloudJobsApi,
  CloudJobListParams,
  CloudJobMutationPayload,
  CloudLifecyclePayload,
  CloudObservabilityApi,
  CloudReadModelsApi,
  CloudTrashApi,
  CloudTrashListParams,
  CloudUserListParams,
} from '../types/cloudOperationalTypes';

export const cloudOperationalQueryKeys = {
  audit: (params: CloudAuditListParams) => ['cloud-audit', params] as const,
  jobs: (params: CloudJobListParams) => ['cloud-jobs', params] as const,
  overview: ['cloud-overview'] as const,
  readModels: ['cloud-read-models'] as const,
  trash: (params: CloudTrashListParams) => ['cloud-trash', params] as const,
  users: (params: CloudUserListParams) => ['cloud-users', params] as const,
  drives: (params: CloudDriveListParams) => ['cloud-drives', params] as const,
  items: (params: CloudItemListParams) => ['cloud-items', params] as const,
  observability: ['cloud-observability'] as const,
};

export const useCloudObservability = (api: CloudObservabilityApi) =>
  useQuery({
    queryKey: cloudOperationalQueryKeys.observability,
    queryFn: ({ signal }) => api.getSummary({ signal }),
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
  });

export const useCloudOverview = (api: CloudReadModelsApi) =>
  useQuery({
    queryKey: cloudOperationalQueryKeys.overview,
    queryFn: ({ signal }) => api.getOverview({ signal }),
  });

export const useCloudUsers = (api: CloudReadModelsApi, params: CloudUserListParams) =>
  useQuery({
    queryKey: cloudOperationalQueryKeys.users(params),
    queryFn: ({ signal }) => api.listUsers({ ...params, signal }),
    placeholderData: keepPreviousData,
  });

export const useCloudDrives = (api: CloudReadModelsApi, params: CloudDriveListParams) =>
  useQuery({
    queryKey: cloudOperationalQueryKeys.drives(params),
    queryFn: ({ signal }) => api.listDrives({ ...params, signal }),
    placeholderData: keepPreviousData,
  });

export const useCloudItems = (api: CloudReadModelsApi, params: CloudItemListParams) =>
  useQuery({
    queryKey: cloudOperationalQueryKeys.items(params),
    queryFn: ({ signal }) => api.listItems({ ...params, signal }),
    placeholderData: keepPreviousData,
  });

export const useCloudTrash = (api: CloudTrashApi, params: CloudTrashListParams) => {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: cloudOperationalQueryKeys.trash(params),
    queryFn: ({ signal }) => api.list({ ...params, signal }),
    placeholderData: keepPreviousData,
  });

  const mutation = useMutation({
    mutationFn: ({
      action,
      itemId,
      payload,
    }: {
      action: 'restore' | 'purge';
      itemId: string;
      payload: CloudLifecyclePayload;
    }) => (action === 'restore' ? api.restore(itemId, payload) : api.purge(itemId, payload)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cloud-trash'] });
      void queryClient.invalidateQueries({ queryKey: cloudOperationalQueryKeys.overview });
    },
  });

  return { mutation, query };
};

export const useCloudJobs = (api: CloudJobsApi, params: CloudJobListParams) => {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: cloudOperationalQueryKeys.jobs(params),
    queryFn: ({ signal }) => api.list({ ...params, signal }),
    placeholderData: keepPreviousData,
  });

  const mutation = useMutation({
    mutationFn: ({
      action,
      jobId,
      payload,
    }: {
      action: 'retry' | 'cancel';
      jobId: string;
      payload: CloudJobMutationPayload;
    }) => (action === 'retry' ? api.retry(jobId, payload) : api.cancel(jobId, payload)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cloud-jobs'] });
    },
  });

  return { mutation, query };
};

export const useCloudAudit = (api: CloudAuditApi, params: CloudAuditListParams) =>
  useQuery({
    queryKey: cloudOperationalQueryKeys.audit(params),
    queryFn: ({ signal }) => api.list({ ...params, signal }),
    placeholderData: keepPreviousData,
  });
