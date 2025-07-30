import { fetchJsonOrError } from '../../../../lib/requests/fetchWithAuthenticityToken';
import { actionUrls } from '../../../../lib/requests/routes.js.erb';

export default async function mergeInboxResults({ ticketId }) {
  const { data } = await fetchJsonOrError(
    actionUrls.tickets.mergeInboxResults(ticketId),
    { method: 'POST' },
  );
  return data;
}
