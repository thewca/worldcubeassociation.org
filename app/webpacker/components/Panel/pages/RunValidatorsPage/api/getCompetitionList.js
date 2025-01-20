import { fetchJsonOrError } from '../../../../../lib/requests/fetchWithAuthenticityToken';
import { apiV0Urls } from '../../../../../lib/requests/routes.js.erb';

export default async function getCompetitionList(startDate, endDate, maxLimit) {
  const { data } = await fetchJsonOrError(
    `${apiV0Urls.competitions.listIndex}?start=${startDate}&end=${endDate}&per_page=${maxLimit}`,
  );
  return data;
}
