import { fetchJsonOrError } from '../../../../lib/requests/fetchWithAuthenticityToken';
import { actionUrls } from '../../../../lib/requests/routes.js.erb';

export default async function createWcaIds({ ticketId, actingStakeholderId, unfinishedPersons }) {
  const { data } = await fetchJsonOrError(
    actionUrls.tickets.createWcaIds(ticketId),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        acting_stakeholder_id: actingStakeholderId,
        unfinished_persons: unfinishedPersons,
      }),
    },
  );
  return data;
}
