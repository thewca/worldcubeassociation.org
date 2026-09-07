import { fetchJsonOrError } from '../../../../../lib/requests/fetchWithAuthenticityToken';
import { bulkUpdateRegistrationUrl, updateRegistrationUrl } from '../../../../../lib/requests/routes.js.erb';

export default async function updateRegistration({
  registrationId,
  payload,
}) {
  const route = updateRegistrationUrl(registrationId);
  const { data } = await fetchJsonOrError(route, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return data;
}

// Bulk Update Route
export async function bulkUpdateRegistrations({
  competitionId,
  payload,
}) {
  const route = bulkUpdateRegistrationUrl(competitionId);
  const { data } = await fetchJsonOrError(route, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return data;
}
