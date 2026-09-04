import { useCallback, useEffect, useState } from 'react';

export interface UseCloudCursorPaginationOptions {
  defaultPageSize?: number;
}

export const useCloudCursorPagination = ({
  defaultPageSize = 25,
}: UseCloudCursorPaginationOptions = {}) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [pageCursors, setPageCursors] = useState<Record<number, string>>({});
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const cursor = pageCursors[page];

  useEffect(() => {
    if (nextCursor && pageCursors[page + 1] !== nextCursor) {
      setPageCursors((previous) => ({ ...previous, [page + 1]: nextCursor }));
    }
  }, [nextCursor, page, pageCursors]);

  const reset = useCallback((nextPageSize = pageSize) => {
    setPage(1);
    setPageSize(nextPageSize);
    setPageCursors({});
    setNextCursor(null);
  }, [pageSize]);

  const goPrevious = useCallback(() => {
    setPage((previous) => Math.max(1, previous - 1));
  }, []);

  const goNext = useCallback(() => {
    if (!nextCursor) {
      return;
    }

    setPage((previous) => previous + 1);
  }, [nextCursor]);

  return {
    cursor,
    goNext,
    goPrevious,
    hasNextPage: Boolean(nextCursor),
    page,
    pageSize,
    reset,
    setNextCursor,
    setPageSize,
  };
};
