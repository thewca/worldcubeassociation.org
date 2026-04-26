import { fetchJsonOrError } from '../../../lib/requests/fetchWithAuthenticityToken';
import { actionUrls } from '../../../lib/requests/routes.js.erb';

export default async function clearClaimWcaId(userId) {
  const { data } = await fetchJsonOrError(
    actionUrls.users.clearClaimWcaId,
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
