import { fetchJsonOrError } from '../../../../lib/requests/fetchWithAuthenticityToken';
import { viewUrls } from '../../../../lib/requests/routes.js.erb';

export default async function getImportedTemporaryResults({ competitionId }) {
  const { data } = await fetchJsonOrError(
    viewUrls.tickets.importedTemporaryResults(competitionId),
  );
  return data || [];
}
