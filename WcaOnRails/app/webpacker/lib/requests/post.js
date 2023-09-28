import { fetchWithAuthenticityToken } from './fetchWithAuthenticityToken';

export default function post(url, data = {}, config = { headers: {} }) {
  const headers = {
    'Content-Type': 'application/json',
    ...(config.headers || {}),
  };
  return fetchWithAuthenticityToken(url, {
    method: 'POST',
    body: JSON.stringify(data),
    headers,
  });
}
