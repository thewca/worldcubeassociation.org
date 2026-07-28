import { fetchJsonOrError } from '../../../../../lib/requests/fetchWithAuthenticityToken';
import { registrationPaymentsUrl } from '../../../../../lib/requests/routes.js.erb';

export default async function getRegistrationPayments(
  registrationId,
) {
  const route = registrationPaymentsUrl(registrationId);
  const { data } = await fetchJsonOrError(route);
  return data;
}
