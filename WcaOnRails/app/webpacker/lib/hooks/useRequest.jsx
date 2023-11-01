import React from 'react';
import { fetchWithAuthenticityToken } from '../requests/fetchWithAuthenticityToken';

export default function useRequest(successTrigger = null, errorTrigger = null) {
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState(null);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (!loading) {
      if (data && successTrigger) {
        successTrigger();
      }
      if (error && errorTrigger) {
        errorTrigger();
      }
    }
  }, [loading, data, error, successTrigger, errorTrigger]);

  const wcaRequest = {
    get: (url, config = {}) => {
      const { params, ...remainingConfig } = config;
      setLoading(true);
      setData(null);
      setError(null);
      const urlWithParams = `${url}?${new URLSearchParams(params || {}).toString()}`;
      fetchWithAuthenticityToken(urlWithParams, {
        ...remainingConfig,
        method: 'GET',
      }).then((response) => {
        switch (config.responseType) {
          case 'blob':
            return response.blob();
          case 'text':
            return response.text();
          default:
            return response.json();
        }
      }).then((response) => {
        setData(response);
        setLoading(false);
      }).catch((err) => {
        setError(err);
        setLoading(false);
      });
    },
  };
  return [wcaRequest, loading, data, error];
}
