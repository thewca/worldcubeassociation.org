import createClient from 'openapi-fetch';
import getJWT from '../../auth/get_jwt';
import { BackendError, EXPIRED_TOKEN } from '../../helper/error_codes';
import { wcaRegistrationUrl } from '../../../../../lib/requests/routes.js.erb';

const { PATCH } = createClient({
  baseUrl: wcaRegistrationUrl,
});

export default async function updateRegistration(
  body,
) {
  const { data, error, response } = await PATCH('/api/v1/register', {
    headers: { Authorization: await getJWT() },
    body,
  });
  if (error) {
    if (error.error === EXPIRED_TOKEN) {
      await getJWT(true);
      return updateRegistration(body);
    }
    throw new BackendError(error.error, response.status);
  }
  return data;
}
