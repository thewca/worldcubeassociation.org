import { fetchJsonOrError } from '../../../lib/requests/fetchWithAuthenticityToken';
import { liveUrls } from '../../../lib/requests/routes.js.erb';

export default async function updateRoundResults({
  roundId, competitionId, registrationId, attempts,
}) {
  const { data } = await fetchJsonOrError(liveUrls.api.updateRoundResult(competitionId, roundId), {
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'PATCH',
    body: JSON.stringify({
      registration_id: registrationId,
      round_id: roundId,
      attempts,
    }),
  });
  return data;
}
