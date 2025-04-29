import { fetchJsonOrError } from '../../../../../lib/requests/fetchWithAuthenticityToken';
import { availableRefundsUrl } from '../../../../../lib/requests/routes.js.erb';

export default async function getAvailableRefunds(
  registrationId,
) {
  const { data } = await fetchJsonOrError(availableRefundsUrl(registrationId));
  return data;
}
