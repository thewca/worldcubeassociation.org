import { useQuery } from '@tanstack/react-query';

import { apiV0Urls } from '../../lib/requests/routes.js.erb';
import { fetchJsonOrError } from '../../lib/requests/fetchWithAuthenticityToken';

const useDelegatesData = () => {
  const {
    data,
    isPending,
  } = useQuery({
    queryKey: ['delegates-index'],
    queryFn: () => fetchJsonOrError(apiV0Urls.delegates.searchIndex),
  });

  return { delegatesLoading: isPending, delegatesData: data?.data };
};

export default useDelegatesData;
