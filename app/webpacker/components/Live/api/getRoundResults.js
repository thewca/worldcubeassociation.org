import { fetchJsonOrError } from '../../../lib/requests/fetchWithAuthenticityToken';
import { liveUrls } from '../../../lib/requests/routes.js.erb';

export default async function getRoundResults(roundId, competitionId) {
  const { data } = await fetchJsonOrError(liveUrls.api.getRoundResults(competitionId, roundId));
  return data;
}
