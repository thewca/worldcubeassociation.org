import { fetchJsonOrError } from '../../../../lib/requests/fetchWithAuthenticityToken';
import { viewUrls } from '../../../../lib/requests/routes.js.erb';

export default async function getUnfinishedPersons({ competitionId }) {
  const { data } = await fetchJsonOrError(
    viewUrls.competitions.unfinishedPersons(competitionId),
  );
  return data || [];
}
