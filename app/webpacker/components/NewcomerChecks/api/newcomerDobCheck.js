import { fetchJsonOrError } from '../../../lib/requests/fetchWithAuthenticityToken';
import { viewUrls } from '../../../lib/requests/routes.js.erb';

export default async function newcomerDobCheck({ competitionId }) {
  const { data } = await fetchJsonOrError(
    viewUrls.competitions.newcomerDobFormatCheck(competitionId),
  );
  return data || {};
}
