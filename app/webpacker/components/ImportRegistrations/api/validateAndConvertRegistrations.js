import { fetchJsonOrError } from '../../../lib/requests/fetchWithAuthenticityToken';
import { actionUrls } from '../../../lib/requests/routes.js.erb';

export default async function validateAndConvertRegistrations({ competitionId, file }) {
  const formData = new FormData();
  formData.append('registration_file', file);
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
