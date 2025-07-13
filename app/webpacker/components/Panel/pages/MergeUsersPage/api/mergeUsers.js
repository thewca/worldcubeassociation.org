import { fetchJsonOrError } from '../../../../../lib/requests/fetchWithAuthenticityToken';
import { actionUrls } from '../../../../../lib/requests/routes.js.erb';

export default async function mergeUsers(toBeMaintainedUserId, toBeAnonymizedUserId) {
  const { data } = await fetchJsonOrError(
    actionUrls.users.merge,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ toBeMaintainedUserId, toBeAnonymizedUserId }),
    },
  );
  return data;
}
