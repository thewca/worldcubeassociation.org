import { useEffect, useState } from 'react';

function getQueryParamsFromBrowserUrl() {
  const entries = (new URLSearchParams(window.location.search)).entries();
  return entries.reduce((accumulator, currentValue) => {
    const [key, value] = currentValue;
    accumulator[key] = value;
    return accumulator;
  }, {});
}

export default function useQueryParams() {
  const [queryParams, setQueryParams] = useState(getQueryParamsFromBrowserUrl());

  useEffect(() => {
    const searchParams = new URLSearchParams(queryParams).toString();
    if (window.location.search !== searchParams) {
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
