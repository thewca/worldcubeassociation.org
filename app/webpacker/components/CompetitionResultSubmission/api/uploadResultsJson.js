import { fetchJsonOrError } from '../../../lib/requests/fetchWithAuthenticityToken';
import { actionUrls } from '../../../lib/requests/routes.js.erb';

export default async function uploadResultsJson({
  competitionId,
  resultFile,
  markResultSubmitted,
  storeUploadedJson,
  importRegistrations,
  isWcif,
}) {
  const formData = new FormData();
  formData.append('results_file', resultFile);
  formData.append('competition_id', competitionId);
  formData.append('mark_result_submitted', markResultSubmitted);
  formData.append('store_uploaded_json', storeUploadedJson);
  if (importRegistrations !== undefined) formData.append('import_registrations', importRegistrations);
  if (isWcif) formData.append('is_wcif', isWcif);

  const { data } = await fetchJsonOrError(
    actionUrls.competitionResultSubmission.uploadResultsJson(competitionId),
    {
      method: 'POST',
      body: formData,
    },
  );

  return data;
}
