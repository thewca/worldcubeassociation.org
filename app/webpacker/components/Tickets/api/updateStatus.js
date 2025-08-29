import { fetchJsonOrError } from '../../../lib/requests/fetchWithAuthenticityToken';
import { actionUrls } from '../../../lib/requests/routes.js.erb';

export default async function updateStatus({ ticketId, status, currentStakeholderId }) {
  await fetchJsonOrError(
    actionUrls.tickets.updateStatus(ticketId),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ticket_status: status,
        acting_stakeholder_id: currentStakeholderId,
      }),
    },
  );
  return status;
}
