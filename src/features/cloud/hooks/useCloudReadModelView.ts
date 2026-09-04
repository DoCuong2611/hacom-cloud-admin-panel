import { keepPreviousData, useQuery } from '@tanstack/react-query';

import type {
  CloudCursorPage,
  CloudDriveListParams,
  CloudDriveReadModel,
  CloudItemListParams,
  CloudItemReadModel,
  CloudOverview,
  CloudReadModelsApi,
  CloudUserListParams,
  CloudUserReadModel,
} from '../types/cloudOperationalTypes';

export type CloudReadModelView = 'overview' | 'users' | 'drives' | 'items';

export type CloudReadModelParams =
  | { view: 'overview'; params?: { signal?: AbortSignal } }
  | { view: 'users'; params: CloudUserListParams }
  | { view: 'drives'; params: CloudDriveListParams }
  | { view: 'items'; params: CloudItemListParams };

export type CloudReadModelResult =
  | CloudOverview
  | CloudCursorPage<CloudUserReadModel>
  | CloudCursorPage<CloudDriveReadModel>
  | CloudCursorPage<CloudItemReadModel>;

export const useCloudReadModelView = (api: CloudReadModelsApi, input: CloudReadModelParams) =>
  useQuery<CloudReadModelResult>({
    queryKey: ['cloud-read-model', input.view, input.view === 'overview' ? undefined : input.params],
    queryFn: ({ signal }) => {
      if (input.view === 'overview') {
        return api.getOverview({ signal });
      }

      if (input.view === 'users') {
        return api.listUsers({ ...input.params, signal });
      }

      if (input.view === 'drives') {
        return api.listDrives({ ...input.params, signal });
      }

      return api.listItems({ ...input.params, signal });
    },
    placeholderData: keepPreviousData,
  });
