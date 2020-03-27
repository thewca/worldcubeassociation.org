function getAuthenticityToken() {
  return document.querySelector('meta[name=csrf-token]').content;
}

function fetchWithAuthenticityToken(url, fetchOptions = {}) {
  const options = {
    ...fetchOptions,
    headers: {
      ...fetchOptions.headers,
      'X-CSRF-Token': getAuthenticityToken(),
    },
  };
  return fetch(url, options);
}

export default fetchWithAuthenticityToken;
