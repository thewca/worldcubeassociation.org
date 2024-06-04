import { fetchJsonOrError } from '../../../../../lib/requests/fetchWithAuthenticityToken';
import { availableRefundsUrl } from '../../../../../lib/requests/routes.js.erb';

export default async function getAvailableRefunds(
  competitionId,
  userId,
) {
  return fetchJsonOrError(availableRefundsUrl(competitionId, userId));
}
