import { fetchJsonOrError } from '../../../../../lib/requests/fetchWithAuthenticityToken';
import { viewUrls } from '../../../../../lib/requests/routes.js.erb';

async function getEvents({ wcaId, competitionId }) {
  const { data } = await fetchJsonOrError(
    viewUrls.persons.competitionEvents(wcaId, competitionId),
  );
  return data || {};
}

export default getEvents;
