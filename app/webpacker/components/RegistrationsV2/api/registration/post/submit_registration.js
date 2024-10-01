import { submitRegistrationUrl } from '../../../../../lib/requests/routes.js.erb';
import fetchWithJWTToken from '../../../../../lib/requests/fetchWithJWTToken';

export default async function submitEventRegistration(
  body,
) {
  const { data } = await fetchWithJWTToken(submitRegistrationUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return data;
}
