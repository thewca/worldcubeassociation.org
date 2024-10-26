import fetchWithJWTToken from '../../../../../lib/requests/fetchWithJWTToken';
import { registrationRoutes } from "../../routes";

export default async function updateRegistration(
  competition,
  body,
) {
  const route = registrationRoutes[competition.registration_version].updateRegistrationUrl;
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
  competition,
  body,
) {
  const route = registrationRoutes[competition.registration_version].bulkUpdateRegistrationUrl;
  const { data } = await fetchWithJWTToken(route, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return data;
}
