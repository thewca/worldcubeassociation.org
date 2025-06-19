import { fetchJsonOrError } from '../../../lib/requests/fetchWithAuthenticityToken';
import { viewUrls } from '../../../lib/requests/routes.js.erb';

export default async function getLastDuplicateCheckerJob({ competitionId }) {
  const { data } = await fetchJsonOrError(
    viewUrls.competitions.lastDuplicateCheckerJob(competitionId),
  );
  return data || {};
}
