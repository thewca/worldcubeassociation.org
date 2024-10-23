import { wcaRegistrationUrl } from '../../../../../lib/requests/routes.js.erb';
import fetchWithJWTToken from '../../../../../lib/requests/fetchWithJWTToken';

const updateRegistrationUrl = `${wcaRegistrationUrl}/api/v1/register`;
const bulkUpdateRegistrationUrl = `${wcaRegistrationUrl}/api/v1/bulk_update`;

export default async function updateRegistration(
  body,
) {
  const { data } = await fetchWithJWTToken(updateRegistrationUrl, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return data;
}

// Bulk Update Route
export async function bulkUpdateRegistrations(
  body,
) {
  const { data } = await fetchWithJWTToken(bulkUpdateRegistrationUrl, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return data;
}
