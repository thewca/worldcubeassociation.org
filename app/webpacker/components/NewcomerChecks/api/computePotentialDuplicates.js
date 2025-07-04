import { fetchJsonOrError } from '../../../lib/requests/fetchWithAuthenticityToken';
import { actionUrls } from '../../../lib/requests/routes.js.erb';

export default async function computePotentialDuplicates({ competitionId }) {
  const { data } = await fetchJsonOrError(
    actionUrls.competition.computePotentialDuplicates(competitionId),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );
  return data;
}
