import { fetchJsonOrError } from '../../../../../lib/requests/fetchWithAuthenticityToken';
import { actionUrls } from '../../../../../lib/requests/routes.js.erb';

export default async function mergeUsers(toUserId, fromUserId) {
  const { data } = await fetchJsonOrError(
    actionUrls.users.merge,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ toUserId, fromUserId }),
    },
  );
  return data;
}
