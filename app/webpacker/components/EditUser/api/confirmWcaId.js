import { fetchJsonOrError } from '../../../lib/requests/fetchWithAuthenticityToken';
import { actionUrls } from '../../../lib/requests/routes.js.erb';

export default async function confirmWcaId(userId, wcaId) {
  const { data } = await fetchJsonOrError(
    actionUrls.users.confirmWcaId,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, wcaId }),
    },
  );
  return data;
}
