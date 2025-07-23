import { fetchJsonOrError } from '../../../lib/requests/fetchWithAuthenticityToken';
import { actionUrls } from '../../../lib/requests/routes.js.erb';

export default async function importWcaLiveResults({
  competitionId,
  resultFile,
  markResultSubmitted,
}) {
  const formData = new FormData();
  formData.append('results_file', resultFile);
  formData.append('competition_id', competitionId);
  formData.append('mark_result_submitted', markResultSubmitted);

  const { data } = await fetchJsonOrError(
    actionUrls.competitionResultSubmission.importWcaLiveResults(competitionId),
    {
      method: 'POST',
      body: formData,
    },
  );

  return data;
}
