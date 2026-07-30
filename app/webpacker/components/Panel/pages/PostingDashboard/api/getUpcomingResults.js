import { fetchJsonOrError } from '../../../../../lib/requests/fetchWithAuthenticityToken';
import { viewUrls } from '../../../../../lib/requests/routes.js.erb';

export default async function getUpcomingResults() {
  const { data } = await fetchJsonOrError(viewUrls.competitions.upcomingResults);
  return data;
}
