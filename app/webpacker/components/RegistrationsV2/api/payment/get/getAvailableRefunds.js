import { fetchJsonOrError } from '../../../../../lib/requests/fetchWithAuthenticityToken';
import { paymentRefundsUrl } from '../../../../../lib/requests/routes.js.erb';

export default async function getAvailableRefunds(
  competitionId,
  userId,
) {
  const { data } = await fetchJsonOrError(paymentRefundsUrl(competitionId, userId));
  return data;
}
