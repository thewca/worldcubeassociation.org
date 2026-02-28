import { fetchJsonOrError } from '../../../../lib/requests/fetchWithAuthenticityToken';
import { actionUrls } from '../../../../lib/requests/routes.js.erb';

export default async function transferClaimWcaId({ ticketId, actingStakeholderId, newDelegateId }) {
  const { data } = await fetchJsonOrError(
    actionUrls.tickets.transferClaimWcaId(ticketId),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        acting_stakeholder_id: actingStakeholderId,
        new_delegate_id: newDelegateId,
      }),
    },
  );
  return data || {};
}
