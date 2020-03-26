export function fetchWithAuthenticityToken(url, fetchOptions) {
  if(!fetchOptions) {
    fetchOptions = {};
  }
  if(!fetchOptions.headers) {
    fetchOptions.headers = {};
  }
  fetchOptions.headers["X-CSRF-Token"] = getAuthenticityToken();
  return fetch(url, fetchOptions);
}

function getAuthenticityToken() {
  return document.querySelector('meta[name=csrf-token]').content;
}

export function fetchJsonOrError(url, fetchOptions = {}) {
  return fetchWithAuthenticityToken(url, fetchOptions)
  .then(response => {
    return Promise.all([response, response.json()]);
  })
  .then(([response, json]) => {
    if(!response.ok) {
      throw new Error(`${response.status}: ${response.statusText}\n${json.error}`);
    }
    return json;
  })
  .catch(e => {
    alert(`Something went wrong while fetching ${url}:\n${e.message}`);
    return {
      requestError: e.message,
    };
  });
}
