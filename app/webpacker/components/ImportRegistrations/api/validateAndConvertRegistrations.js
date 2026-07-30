import { fetchJsonOrError } from '../../../lib/requests/fetchWithAuthenticityToken';
import { actionUrls } from '../../../lib/requests/routes.js.erb';

export default async function validateAndConvertRegistrations({ competitionId, csvFile }) {
  const formData = new FormData();
  formData.append('csv_registration_file', csvFile);
  formData.append('competition_id', competitionId);

  const { data } = await fetchJsonOrError(
    actionUrls.competition.validateAndConvertRegistrations(competitionId),
    {
      method: 'POST',
      body: formData,
    },
  );

  return data;
}
