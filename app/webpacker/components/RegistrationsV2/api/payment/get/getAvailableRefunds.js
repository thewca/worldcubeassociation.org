import { fetchJsonOrError } from '../../../../../lib/requests/fetchWithAuthenticityToken';
import { paymentRefundsUrl } from '../../../../../lib/requests/routes.js.erb';

export default async function getAvailableRefunds(
  competitionId,
  userId,
) {
  return fetchJsonOrError(paymentRefundsUrl(competitionId, userId));
}
