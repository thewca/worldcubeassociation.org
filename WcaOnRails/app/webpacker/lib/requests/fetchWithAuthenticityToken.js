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
          throw new Error(`${response.status}: ${response.statusText}\n${json.error}`);
        }
        return json;
      }));
}
