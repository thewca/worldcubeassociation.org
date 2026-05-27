import FetchJsonError from './FetchJsonError';

export function fetchWithAuthenticityToken(url, fetchOptions) {
  const options = fetchOptions || {};
  if (!options.headers) {
    options.headers = {};
  }
  const csrfTokenElement = document.querySelector('meta[name=csrf-token]');
  if (csrfTokenElement) {
    options.headers['X-CSRF-Token'] = csrfTokenElement.content;
  }
  return fetch(url, options);
}

export function fetchJsonOrError(url, fetchOptions = {}) {
  return fetchWithAuthenticityToken(url, fetchOptions)
    .then((response) => response.json()
      .then((json) => {
        if (!response.ok) {
          throw new FetchJsonError(`${response.status}: ${response.statusText}\n${json.error}`, response, json);
        }
        return { data: json, headers: response.headers };
      }).catch((err) => {
        if (err instanceof FetchJsonError) throw err;
        throw new FetchJsonError(`${response.status}: ${response.statusText}\nPlease Report this to WST\nRequestId: ${response.headers.get("x-request-id")}`, response, { status: 'An unexpected error occurred.' });
      }));
}
