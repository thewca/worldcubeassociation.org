import { fetchJsonOrError } from '../../../lib/requests/fetchWithAuthenticityToken';
import { actionUrls } from '../../../lib/requests/routes.js.erb';

export default async function importRegistrations({ competitionId, csvFile }) {
  const formData = new FormData();
  formData.append('csv_registration_file', csvFile);
  formData.append('competition_id', competitionId);

  const { data } = await fetchJsonOrError(
    actionUrls.competition.importRegistrations(competitionId),
    {
      method: 'POST',
      body: formData,
    },
  );

  return data;
}
