import { fetchJsonOrError } from '../../../../lib/requests/fetchWithAuthenticityToken';
import { adminDeleteResultsDataUrl } from '../../../../lib/requests/routes.js.erb';

export default async function deleteResultsData({ competitionId, roundId, model }) {
  const { data } = await fetchJsonOrError(
    adminDeleteResultsDataUrl(competitionId, roundId, model),
    {
      method: 'DELETE',
    },
  );
  return data;
}
