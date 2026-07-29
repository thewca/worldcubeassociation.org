import { fetchJsonOrError } from '../../../lib/requests/fetchWithAuthenticityToken';
import { actionUrls } from '../../../lib/requests/routes.js.erb';

export default async function submitToWrt({ competitionId, message }) {
  const { data } = await fetchJsonOrError(
    actionUrls.competitionResultSubmission.submitToWrt(competitionId),
    {
      method: 'POST',
      body: JSON.stringify({
        message,
      }),
      headers: {
        'Content-type': 'application/json',
      },
    },
  );
  return data;
}
