import { fetchJsonOrError } from '../../../lib/requests/fetchWithAuthenticityToken';
import { actionUrls } from '../../../lib/requests/routes.js.erb';

export default async function createStakeholder({
  ticketId, connection, stakeholderRole, isActive,
}) {
  const { data } = await fetchJsonOrError(
    actionUrls.tickets.createStakeholder(ticketId),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ connection, stakeholderRole, isActive }),
    },
  );
  return data;
}
