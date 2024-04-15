import { wcaRegistrationUrl } from '../../../../../lib/requests/routes.js.erb';
import fetchWithJWTToken from '../../../../../lib/requests/fetchWithJWTToken';

const updateRegistrationUrl = `${wcaRegistrationUrl}/api/v1/register`;

export default async function updateRegistration(
  body,
) {
  const { data } = await fetchWithJWTToken(updateRegistrationUrl, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  return data;
}
