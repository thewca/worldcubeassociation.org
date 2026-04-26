import { fetchJsonOrError } from '../../../lib/requests/fetchWithAuthenticityToken';
import { actionUrls } from '../../../lib/requests/routes.js.erb';

export default async function unlinkWcaId(userId) {
  const { data } = await fetchJsonOrError(
    actionUrls.users.unlinkWcaId,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    },
  );
  return data;
}
