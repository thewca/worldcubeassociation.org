import { fetchJsonOrError } from '../../../../../lib/requests/fetchWithAuthenticityToken';
import { viewUrls } from '../../../../../lib/requests/routes.js.erb';

export async function getResults({ wcaId, competitionId, eventId }) {
  const { data } = await fetchJsonOrError(
    viewUrls.persons.results(wcaId, competitionId, eventId),
  );
  return data || {};
}

export async function getEvents({ wcaId, competitionId }) {
  const resultsList = await getResults({ wcaId, competitionId });
  return _.uniq(_.map(resultsList, 'event_id'));
}

export async function getCompetitions({ wcaId }) {
  const resultsList = await getResults({ wcaId });
  return _.uniqBy(resultsList, 'competition_id')
    .map((item) => ({
      competitionId: item.competition_id,
      competitionName: item.competition_name,
    }));
}
