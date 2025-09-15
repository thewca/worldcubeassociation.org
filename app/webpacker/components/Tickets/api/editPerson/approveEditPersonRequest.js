import { fetchJsonOrError } from '../../../../lib/requests/fetchWithAuthenticityToken';
import { actionUrls } from '../../../../lib/requests/routes.js.erb';

export default async function approveEditPersonRequest({
  ticketId,
  actingStakeholderId,
  changeType,
}) {
  const { data } = await fetchJsonOrError(
    actionUrls.tickets.approveEditPersonRequest(ticketId),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        acting_stakeholder_id: actingStakeholderId,
        change_type: changeType,
      }),
    },
  );
  return data || {};
}
