import { fetchJsonOrError } from '../../../lib/requests/fetchWithAuthenticityToken';
import { actionUrls } from '../../../lib/requests/routes.js.erb';

export default async function joinAsBccStakeholder({
  ticketId, connection, stakeholderRole, isActive,
}) {
  await fetchJsonOrError(
    actionUrls.tickets.joinAsBccStakeholder(ticketId),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        connection,
        stakeholder_role: stakeholderRole,
        is_active: isActive,
      }),
    },
  );
}
