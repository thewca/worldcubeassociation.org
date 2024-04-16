import { apiV0Urls } from '../../../../lib/requests/routes.js.erb';
import FetchJsonError from '../../../../lib/requests/FetchJsonError';

const JWT_KEY = 'jwt';

export default async function getJWT(reauthenticate = false) {
  // the jwt token is cached in local storage, if it has expired, we need to reauthenticate
  const cachedToken = localStorage.getItem(JWT_KEY);
  if (reauthenticate || cachedToken === null) {
    const response = await fetch(apiV0Urls.users.me.token);
    const body = await response.json();
    if (response.ok) {
      const token = response.headers.get('authorization');
      if (token !== null) {
        localStorage.setItem(JWT_KEY, token);
        return token;
      }
      // This should not happen, but I am throwing an error here regardless
      throw new FetchJsonError(response.status, response, body);
    }
    throw new FetchJsonError(response.status, response, body);
  } else {
    return cachedToken;
  }
}
