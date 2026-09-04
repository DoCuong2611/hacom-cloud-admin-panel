import { useQuery } from '@tanstack/react-query';

import type { CloudJobsApi } from '../types/cloudOperationalTypes';

export const useCloudJobDetail = (api: CloudJobsApi, jobId?: string) =>
  useQuery({
    queryKey: ['cloud-job-detail', jobId],
    queryFn: ({ signal }) => api.get(jobId as string, { signal }),
    enabled: Boolean(jobId),
  });
