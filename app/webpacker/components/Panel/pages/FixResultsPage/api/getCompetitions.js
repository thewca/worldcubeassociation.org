import { fetchJsonOrError } from '../../../../../lib/requests/fetchWithAuthenticityToken';
import { viewUrls } from '../../../../../lib/requests/routes.js.erb';

async function getCompetitions({ wcaId }) {
  const { data } = await fetchJsonOrError(
    viewUrls.persons.results(wcaId),
  );
  const resultsList = data || {};
  const competitionsList = _.uniqBy(resultsList, 'competition_id')
    .map((item) => ({
      competitionId: item.competition_id,
      competitionName: item.competition_name,
    })).reverse();
  return competitionsList;
}

export default getCompetitions;
