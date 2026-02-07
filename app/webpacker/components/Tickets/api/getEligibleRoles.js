import { fetchJsonOrError } from '../../../lib/requests/fetchWithAuthenticityToken';
import { actionUrls } from '../../../lib/requests/routes.js.erb';

export default async function getEligibleRoles({ ticketId }) {
  const { data } = await fetchJsonOrError(
    actionUrls.tickets.eligibleRoles(ticketId),
  );
  return data?.eligible_roles || [];
}
