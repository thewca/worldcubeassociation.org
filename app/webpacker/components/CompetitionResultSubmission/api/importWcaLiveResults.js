import { fetchJsonOrError } from '../../../lib/requests/fetchWithAuthenticityToken';
import { actionUrls } from '../../../lib/requests/routes.js.erb';

export default async function importWcaLiveResults({
  competitionId,
  markResultSubmitted,
  storeUploadedJson,
}) {
  const { data } = await fetchJsonOrError(
    actionUrls.competitionResultSubmission.importWcaLiveResults(competitionId),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mark_result_submitted: markResultSubmitted,
        store_uploaded_json: storeUploadedJson,
      }),
    },
  );

  return data;
}
