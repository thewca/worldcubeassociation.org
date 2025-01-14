import fetchWithJWTToken from '../../../../../lib/requests/fetchWithJWTToken';
import { bulkAutoAcceptRegistrationsUrl, bulkUpdateRegistrationUrl, updateRegistrationUrl } from '../../../../../lib/requests/routes.js.erb';

export default async function updateRegistration(
  body,
) {
  const route = updateRegistrationUrl;
  const { data } = await fetchWithJWTToken(route, {
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
  const route = bulkUpdateRegistrationUrl;
  const { data } = await fetchWithJWTToken(route, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return data;
}
