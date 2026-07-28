import { fetchJsonOrError } from '../../../lib/requests/fetchWithAuthenticityToken';
import { viewUrls } from '../../../lib/requests/routes.js.erb';

export default async function getLogs({ ticketId }) {
  const { data } = await fetchJsonOrError(
    viewUrls.tickets.listLogs(ticketId),
  );
  return data || {};
}
