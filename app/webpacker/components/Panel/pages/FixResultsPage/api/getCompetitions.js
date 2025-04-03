import { fetchJsonOrError } from '../../../../../lib/requests/fetchWithAuthenticityToken';
import { apiV0Urls } from '../../../../../lib/requests/routes.js.erb';

async function getCompetitions({ wcaId }) {
  const { data } = await fetchJsonOrError(
    apiV0Urls.persons.competitions(wcaId),
  );
  return data || {};
}

export default getCompetitions;
