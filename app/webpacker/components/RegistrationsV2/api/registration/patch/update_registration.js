import { updateRegistrationUrl, bulkUpdateRegistrationUrl } from '../../../../../lib/requests/routes.js.erb';
import fetchWithJWTToken from '../../../../../lib/requests/fetchWithJWTToken';

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
