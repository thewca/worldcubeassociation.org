import { fetchJsonOrError } from '../../../../lib/requests/fetchWithAuthenticityToken';
import { actionUrls } from '../../../../lib/requests/routes.js.erb';

export default async function getEditPersonValidators({ ticketId }) {
  const { data } = await fetchJsonOrError(
    actionUrls.tickets.editPersonValidators(ticketId),
  );
  return data || {};
}
