import { useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';

import { apiV0Urls, WCA_API_PAGINATION } from '../../lib/requests/routes.js.erb';
import { fetchJsonOrError } from '../../lib/requests/fetchWithAuthenticityToken';

const useDelegatesData = () => {
  const {
    data,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ['delegates'],
    queryFn: ({ pageParam = 1 }) => fetchJsonOrError(`${apiV0Urls.delegates.list}?page=${pageParam}`),
    getNextPageParam: (previousPage, allPages) => {
      // Continue until less than a full page of data is fetched,
      // which indicates the very last page.
      if (previousPage.data.length < WCA_API_PAGINATION) {
        return undefined;
      }
      return allPages.length + 1;
    },
  });

  useEffect(() => {
    if (hasNextPage) {
      fetchNextPage();
    }
  }, [data, hasNextPage, fetchNextPage]);

  const delegatesData = data?.pages.flatMap((page) => page.data);

  return delegatesData;
};

export default useDelegatesData;
