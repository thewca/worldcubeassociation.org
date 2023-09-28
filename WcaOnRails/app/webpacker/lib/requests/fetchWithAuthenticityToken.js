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
        return { data: json, headers: response.headers };
      }));
}

export function post(url, data = {}, config = {
  headers: { 'Content-Type': 'application/json' },
  auth: { required: true },
}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(config.headers || {}),
  };
  if (config.auth && config.auth.required) {
    const csrfTokenElement = document.querySelector('meta[name=csrf-token]');
    if (csrfTokenElement) {
      headers['X-CSRF-Token'] = csrfTokenElement.content;
    }
  }
  return fetch(url, {
    method: 'POST',
    body: JSON.stringify(data),
    headers,
  });
}
