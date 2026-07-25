import { fetchJsonOrError } from '../../../../lib/requests/fetchWithAuthenticityToken';
import { actionUrls } from '../../../../lib/requests/routes.js.erb';

export default async function deleteInboxPersons({ ticketId }) {
  const { data } = await fetchJsonOrError(
    actionUrls.tickets.deleteInboxPersons(ticketId),
    { method: 'POST' },
  );
  return data;
}
