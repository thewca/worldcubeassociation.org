import { fetchJsonOrError } from '../../../../lib/requests/fetchWithAuthenticityToken';
import { clearResultsSubmissionUrl } from '../../../../lib/requests/routes.js.erb';

export default async function clearResultsSubmission({ competitionId }) {
  const { data } = await fetchJsonOrError(
    clearResultsSubmissionUrl(competitionId),
    { method: 'POST' },
  );
  return data;
}
