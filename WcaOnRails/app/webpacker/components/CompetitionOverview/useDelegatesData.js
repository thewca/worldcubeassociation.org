import { useEffect, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';

import { delegatesApiUrl, WCA_API_PAGINATION } from '../../lib/requests/routes.js.erb';
import { fetchJsonOrError } from '../../lib/requests/fetchWithAuthenticityToken';

const useDelegatesData = () => {
  const [delegatesData, setDelegatesData] = useState([]);

  const {
    data: rawDelegatesData,
    fetchNextPage: delegateFetchNextPage,
    hasNextPage: delegateHasNextPage,
  } = useInfiniteQuery({
    queryKey: ['delegates'],
    queryFn: ({ pageParam = 1 }) => fetchJsonOrError(`${delegatesApiUrl}?page=${pageParam}`),
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
    const flatData = rawDelegatesData?.pages
      .map((page) => page.data)
      .flatMap((delegate) => delegate);
    setDelegatesData(flatData);

    if (delegateHasNextPage) {
      delegateFetchNextPage();
    }
  }, [rawDelegatesData, delegateHasNextPage, delegateFetchNextPage]);

  return delegatesData;
};

export default useDelegatesData;
