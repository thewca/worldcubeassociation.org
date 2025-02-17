import { fetchJsonOrError } from '../../../lib/requests/fetchWithAuthenticityToken';
import { liveUrls } from '../../../lib/requests/routes.js.erb';

export default async function getRoundResults(roundId, competitionId) {
  const { data } = await fetchJsonOrError(liveUrls.api.getRoundResults(competitionId, roundId));
  return data;
}

export const roundResultsKey = (roundId) => ['round-results', roundId];

export const insertNewResult = (roundResults, newResult) => {
  const { registration_id: updatedRegistrationId } = newResult;

  const untouchedResults = roundResults.filter(
    ({ registration_id: registrationId }) => registrationId !== updatedRegistrationId,
  );

  return [...untouchedResults, newResult];
};
