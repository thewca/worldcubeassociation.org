import { competitionApiUrl } from '../../../../lib/requests/routes.js.erb';
import { fetchJsonOrError } from '../../../../lib/requests/fetchWithAuthenticityToken';

export default async function getCompetitionInfo(competitionId) {
  console.log("getting competition info")
  const route = competitionApiUrl(competitionId);
  const { data } = await fetchJsonOrError(route);
  return data;
}
