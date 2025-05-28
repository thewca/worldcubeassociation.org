import { fetchJsonOrError } from '../../../../../lib/requests/fetchWithAuthenticityToken';
import { viewUrls } from '../../../../../lib/requests/routes.js.erb';

async function getEvents({ wcaId, competitionId }) {
  const { data } = await fetchJsonOrError(
    viewUrls.persons.results(wcaId, competitionId),
  );
  const resultsList = data || {};
  return _.uniq(_.map(resultsList, 'event_id'));
}

export default getEvents;
