import { fetchJsonOrError } from '../../../../../lib/requests/fetchWithAuthenticityToken';
import { viewUrls } from '../../../../../lib/requests/routes.js.erb';

export default async function getCompetitionCount(startDate, endDate) {
  const { data } = await fetchJsonOrError(viewUrls.competitions.countInRange(startDate, endDate));
  return data;
}
