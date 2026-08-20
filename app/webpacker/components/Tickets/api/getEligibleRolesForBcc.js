import { fetchJsonOrError } from '../../../lib/requests/fetchWithAuthenticityToken';
import { actionUrls } from '../../../lib/requests/routes.js.erb';

export default async function getEligibleRolesForBcc({ ticketId }) {
  const { data } = await fetchJsonOrError(
    actionUrls.tickets.eligibleRolesForBcc(ticketId),
  );
  return data?.eligible_roles_for_bcc || [];
}
