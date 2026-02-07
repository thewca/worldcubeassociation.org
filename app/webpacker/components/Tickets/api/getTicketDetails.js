import { fetchWithAuthenticityToken } from '../../../lib/requests/fetchWithAuthenticityToken';
import { actionUrls } from '../../../lib/requests/routes.js.erb';

export default async function getTicketDetails({ ticketId }) {
  const response = await fetchWithAuthenticityToken(
    actionUrls.tickets.show(ticketId),
  );

  if (!response.ok) {
    const error = new Error(`${response.status}: ${response.statusText}`);
    error.status = response.status;
    throw error;
  }

  const data = await response.json();
  return data || {};
}
