import { fetchJsonOrError } from '../../../lib/requests/fetchWithAuthenticityToken';
import { liveUrls } from '../../../lib/requests/routes.js.erb';

export default async function submitRoundResults({
  roundId, competitionId, registrationId, attempts,
}) {
  const { data } = await fetchJsonOrError(liveUrls.api.addRoundResult(competitionId, roundId), {
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify({
      registration_id: registrationId,
      round_id: roundId,
      attempts,
    }),
  });
  return data;
}
