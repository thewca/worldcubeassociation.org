import { fetchJsonOrError } from '../../../lib/requests/fetchWithAuthenticityToken';
import { viewUrls } from '../../../lib/requests/routes.js.erb';

export default async function getPotentialDuplicatesData({ competitionId }) {
  const { data } = await fetchJsonOrError(
    viewUrls.competitions.potentialDuplicatesData(competitionId),
  );
  return data || {};
}
