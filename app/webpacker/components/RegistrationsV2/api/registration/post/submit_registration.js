import fetchWithJWTToken from '../../../../../lib/requests/fetchWithJWTToken';
import { submitRegistrationUrl } from '../../../../../lib/requests/routes.js.erb';

export default async function submitEventRegistration(
  body,
) {
  const route = submitRegistrationUrl;
  const { data } = await fetchWithJWTToken(route, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return data;
}
