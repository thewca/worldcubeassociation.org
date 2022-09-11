import { useState, useEffect, useCallback } from 'react';
import { fetchJsonOrError } from '../requests/fetchWithAuthenticityToken';

// This is a hook that can be used to get a data from the website (as json)
// It assumes that 'url' is a valid, GET-able, url.
// Example of usage:
// const { data, loading, error, sync } = useLoadedData(`path/to/resource`);
const useLoadedData = (url) => {
  const [data, setData] = useState(null);
  const [headers, setHeaders] = useState(new Headers());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const sync = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchJsonOrError(url).then((response) => {
      setData(response.data);
      setHeaders(response.headers);
    }).catch((err) => {
      setError(err.message);
    }).finally(() => setLoading(false));
  }, [url, setData, setError]);

  useEffect(sync, [sync]);

  return {
    data,
    headers,
    loading,
    error,
    sync,
  };
};

export default useLoadedData;
