import { fetchJsonOrError } from '../../../lib/requests/fetchWithAuthenticityToken';
import { viewUrls } from '../../../lib/requests/routes.js.erb';

export default async function newcomerNameFormatCheck({ competitionId }) {
  const { data } = await fetchJsonOrError(
    viewUrls.competitions.newcomerNameFormatCheck(competitionId),
  );
  return data || {};
}
