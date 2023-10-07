import {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';

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
    setData(null);
    setError(null);
    fetchJsonOrError(url).then((response) => {
      setData(response.data);
      setHeaders(response.headers);
    }).catch((err) => {
      setError(err.message);
    }).finally(() => setLoading(false));
  }, [url, setData, setHeaders, setError]);

  useEffect(sync, [sync]);

  return {
    data,
    headers,
    loading,
    error,
    sync,
  };
};

export const useManyLoadedData = (ids, urlFn) => {
  const [data, setData] = useState({});
  const [headers, setHeaders] = useState({});
  const [error, setError] = useState({});

  const [anyLoading, setAnyLoading] = useState(true);

  const promises = useMemo(() => ids.map((id) => {
    const url = urlFn(id);

    return fetchJsonOrError(url)
      .then((response) => {
        setData((prevData) => ({
          ...prevData,
          [id]: response.data,
        }));
        setHeaders((prevHeaders) => ({
          ...prevHeaders,
          [id]: response.headers,
        }));
      })
      .catch((err) => {
        setError((prevError) => ({
          ...prevError,
          [id]: err.message,
        }));
      });
  }), [ids, urlFn, setData, setHeaders, setError]);

  const syncAll = useCallback(() => {
    setAnyLoading(true);
    setData({});
    setError({});
    Promise.all(promises).finally(() => setAnyLoading(false));
  }, [promises]);

  useEffect(syncAll, [syncAll]);

  return {
    data,
    headers,
    anyLoading,
    error,
    syncAll,
  };
};

export default useLoadedData;
