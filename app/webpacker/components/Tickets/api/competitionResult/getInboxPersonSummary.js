import { fetchJsonOrError } from '../../../../lib/requests/fetchWithAuthenticityToken';
import { viewUrls } from '../../../../lib/requests/routes.js.erb';

export default async function getInboxPersonSummary({ ticketId }) {
  const { data } = await fetchJsonOrError(
    viewUrls.tickets.inboxPersonSummary(ticketId),
  );
  return data || [];
}
