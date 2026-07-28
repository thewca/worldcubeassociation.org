import { fetchJsonOrError } from '../../../../lib/requests/fetchWithAuthenticityToken';
import { viewUrls } from '../../../../lib/requests/routes.js.erb';

export default async function getEventsMergedData({ ticketId }) {
  const { data } = await fetchJsonOrError(
    viewUrls.tickets.eventsMergedData(ticketId),
  );
  return data || [];
}
