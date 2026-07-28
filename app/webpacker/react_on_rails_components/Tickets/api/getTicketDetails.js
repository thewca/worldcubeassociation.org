import { fetchJsonOrError } from '../../../lib/requests/fetchWithAuthenticityToken';
import { actionUrls } from '../../../lib/requests/routes.js.erb';

export default async function getTicketDetails({ ticketId }) {
  const { data } = await fetchJsonOrError(
    actionUrls.tickets.show(ticketId),
  );
  return data || {};
}
