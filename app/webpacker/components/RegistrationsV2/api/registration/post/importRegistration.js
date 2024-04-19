import fetchWithJWTToken from '../../../../../lib/requests/fetchWithJWTToken';
import { wcaRegistrationUrl } from '../../../../../lib/requests/routes.js.erb';

const submitImportUrl = (competitionId) => `${wcaRegistrationUrl}/api/v1/${competitionId}/import`;
export default async function importRegistration({
  competitionId,
  file,
}) {
  const formData = new FormData();
  formData.append('csv_data', file);
  const response = await fetchWithJWTToken(
    submitImportUrl(competitionId),
    {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );
  return response.json();
}
