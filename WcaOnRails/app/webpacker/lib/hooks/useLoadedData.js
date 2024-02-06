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
  const [error, setError] = useState(null);

  const [loading, setLoading] = useState(true);

  const sync = useCallback(() => {
    setLoading(true);

    setHeaders(new Headers());
    setError(null);

    fetchJsonOrError(url).then((response) => {
      setData(response.data);
      setHeaders(response.headers);
    }).catch((err) => {
      setError(err.message);
    }).finally(() => setLoading(false));
  }, [url, setLoading, setData, setHeaders, setError]);

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
  const defaultData = useCallback(
    (defaultValue) => Object.fromEntries(ids.map((id) => [id, defaultValue])),
    [ids],
  );

  const [data, setData] = useState(defaultData(null));
  const [headers, setHeaders] = useState(defaultData(new Headers()));
  const [error, setError] = useState(defaultData(null));

  const [anyLoading, setAnyLoading] = useState(true);

  const promises = useMemo(() => ids.map(async (id) => {
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

    setHeaders(defaultData(new Headers()));
    setError(defaultData(null));

    Promise.all(promises).finally(() => setAnyLoading(false));
  }, [promises, defaultData, setAnyLoading]);

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
