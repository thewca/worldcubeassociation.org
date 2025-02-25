import { fetchJsonOrError } from '../../../../../lib/requests/fetchWithAuthenticityToken';
import { actionUrls } from '../../../../../lib/requests/routes.js.erb';

export default async function anonymize({ userId, wcaId }) {
  const { data } = await fetchJsonOrError(
    actionUrls.tickets.anonymize,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        wcaId,
      }),
    },
  );
  return data;
}
