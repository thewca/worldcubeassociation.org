import { fetchJsonOrError } from '../../../lib/requests/fetchWithAuthenticityToken';
import { viewUrls } from '../../../lib/requests/routes.js.erb';

export default async function getComments({ ticketId }) {
  const { data } = await fetchJsonOrError(
    viewUrls.tickets.listComments(ticketId),
  );
  return data || {};
}
