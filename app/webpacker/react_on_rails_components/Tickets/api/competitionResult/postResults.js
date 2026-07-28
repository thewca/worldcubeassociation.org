import { fetchJsonOrError } from '../../../../lib/requests/fetchWithAuthenticityToken';
import { actionUrls } from '../../../../lib/requests/routes.js.erb';

export default async function postResults({ ticketId }) {
  const { data } = await fetchJsonOrError(
    actionUrls.tickets.postResults(ticketId),
    { method: 'POST' },
  );
  return data;
}
