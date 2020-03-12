function fetchWithAuthenticityToken(url, fetchOptions) {
  if (!fetchOptions) {
    fetchOptions = {};
  }
  if (!fetchOptions.headers) {
    fetchOptions.headers = {};
  }
  fetchOptions.headers['X-CSRF-Token'] = getAuthenticityToken();
  return fetch(url, fetchOptions);
}

function getAuthenticityToken() {
  return document.querySelector('meta[name=csrf-token]').content;
}

export default fetchWithAuthenticityToken;
