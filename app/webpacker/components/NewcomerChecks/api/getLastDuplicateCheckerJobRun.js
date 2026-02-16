import { fetchJsonOrError } from '../../../lib/requests/fetchWithAuthenticityToken';
import { viewUrls } from '../../../lib/requests/routes.js.erb';

export default async function getLastDuplicateCheckerJobRun({ competitionId }) {
  const { data } = await fetchJsonOrError(
    viewUrls.competitions.lastDuplicateCheckerJobRun(competitionId),
  );
  return data || {};
}
