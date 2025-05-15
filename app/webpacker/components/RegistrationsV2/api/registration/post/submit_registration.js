import fetchWithJWTToken from '../../../../../lib/requests/fetchWithJWTToken';
import { submitRegistrationUrl } from '../../../../../lib/requests/routes.js.erb';

export default async function submitEventRegistration({
  competitionId,
  payload,
}) {
  const route = submitRegistrationUrl(competitionId);
  const { data } = await fetchWithJWTToken(route, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return data;
}
