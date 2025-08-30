import { fetchJsonOrError } from '../../../../lib/requests/fetchWithAuthenticityToken';
import { actionUrls } from '../../../../lib/requests/routes.js.erb';

export default async function syncEditPersonRequest({ ticketId, actingStakeholderId }) {
  const { data } = await fetchJsonOrError(
    actionUrls.tickets.syncEditPersonRequest(ticketId),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        acting_stakeholder_id: actingStakeholderId,
      }),
    },
  );
  return data;
}
