import { fetchJsonOrError } from '../../../../lib/requests/fetchWithAuthenticityToken';
import { actionUrls } from '../../../../lib/requests/routes.js.erb';

export default async function mergeTemporaryResults({ ticketId }) {
  const { data } = await fetchJsonOrError(
    actionUrls.tickets.mergeTemporaryResults(ticketId),
    { method: 'POST' },
  );
  return data;
}
