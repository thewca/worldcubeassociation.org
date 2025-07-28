import { fetchJsonOrError } from '../../../lib/requests/fetchWithAuthenticityToken';
import { actionUrls } from '../../../lib/requests/routes.js.erb';

export default async function updateUserData(userDetails) {
  const { data } = await fetchJsonOrError(
    actionUrls.users.updateUserData,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...userDetails }),
    },
  );
  return data;
}
