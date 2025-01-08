import { fetchJsonOrError } from '../../../lib/requests/fetchWithAuthenticityToken';
import { rankingsUrl } from '../../../lib/requests/routes.js.erb';

// eslint-disable-next-line import/prefer-default-export
export async function getRankings(eventId, rankingType, year, region) {
  const { data } = await fetchJsonOrError(rankingsUrl(eventId, rankingType, year, region), { headers: { Accept: 'application/json' } });
  return data;
}
