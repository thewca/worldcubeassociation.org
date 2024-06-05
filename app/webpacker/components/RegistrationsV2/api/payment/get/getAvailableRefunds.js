import { fetchJsonOrError } from '../../../../../lib/requests/fetchWithAuthenticityToken';
import { availableRefundsUrl } from '../../../../../lib/requests/routes.js.erb';

export default async function getAvailableRefunds(
  competitionId,
  userId,
) {
  const { data } = await fetchJsonOrError(availableRefundsUrl(competitionId, userId));
  return data;
}
