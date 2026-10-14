import { fetchJsonOrError } from '../../../../../lib/requests/fetchWithAuthenticityToken';
import { viewUrls } from '../../../../../lib/requests/routes.js.erb';

export default async function getPendingResultsSubmissions() {
  const { data } = await fetchJsonOrError(viewUrls.competitions.pendingResultsSubmissions);
  return data;
}
