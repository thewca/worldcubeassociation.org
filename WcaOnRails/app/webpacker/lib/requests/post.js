export default function post(url, data = {}, config = {
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
