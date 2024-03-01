import { useEffect, useState } from 'react';

function getQueryParamsFromBrowserUrl() {
  return Object.fromEntries(new URLSearchParams(window.location.search));
}

export default function useQueryParams() {
  const [queryParams, setQueryParams] = useState(getQueryParamsFromBrowserUrl());

  useEffect(() => {
    const searchParams = new URLSearchParams(queryParams).toString();
    const currentSearchParams = window.location.search.startsWith('?')
      ? window.location.search.split('?')[1]
      : window.location.search;
    if (currentSearchParams !== searchParams) {
      window.location.search = searchParams;
    }
  }, [queryParams]);

  function updateQueryParam(key, value) {
    setQueryParams({
      ...queryParams,
      [key]: value,
    });
  }

  return [queryParams, updateQueryParam];
}
