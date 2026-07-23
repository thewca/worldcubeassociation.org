import { fetchJsonOrError } from '../../../../../lib/requests/fetchWithAuthenticityToken';
import { submitRegistrationUrl } from '../../../../../lib/requests/routes.js.erb';

export default async function submitEventRegistration({
  competitionId,
  payload,
}) {
  const route = submitRegistrationUrl(competitionId);
  const { data } = await fetchJsonOrError(route, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return data;
}
