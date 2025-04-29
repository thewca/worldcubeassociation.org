import { fetchJsonOrError } from '../../../../../lib/requests/fetchWithAuthenticityToken';
import { registrationPaymentsUrl } from '../../../../../lib/requests/routes.js.erb';

export default async function getRegistrationPayments(
  competitionId,
  registrationId,
) {
  const { data } = await fetchJsonOrError(registrationPaymentsUrl(competitionId, registrationId));
  return data;
}
