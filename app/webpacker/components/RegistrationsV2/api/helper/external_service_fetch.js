import { BackendError } from './error_codes';

export default async function externalServiceFetch(
  route,
  options = {},
  needsResponse = true,
) {
  const response = await fetch(route, options);
  if (needsResponse) {
    const body = await response.json();
    if (response.ok) {
      return body;
    }

    throw new BackendError(body.error, response.status);
  } else {
    return response.ok;
  }
}
