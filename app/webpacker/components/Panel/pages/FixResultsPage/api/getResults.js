import { fetchJsonOrError } from '../../../../../lib/requests/fetchWithAuthenticityToken';
import { viewUrls } from '../../../../../lib/requests/routes.js.erb';

async function getResults({ wcaId, competitionId, eventId }) {
  const { data } = await fetchJsonOrError(
    viewUrls.persons.competitionEventResults(wcaId, competitionId, eventId),
  );
  return data || {};
}

export default getResults;
