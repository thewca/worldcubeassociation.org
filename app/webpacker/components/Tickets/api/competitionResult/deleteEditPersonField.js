import { fetchJsonOrError } from '../../../../lib/requests/fetchWithAuthenticityToken';
import { actionUrls } from '../../../../lib/requests/routes.js.erb';

export default async function deleteEditPersonField({
  ticketId,
  editPersonFieldId,
  actingStakeholderId,
}) {
  const { data } = await fetchJsonOrError(
    actionUrls.tickets.editPersonField(ticketId, editPersonFieldId),
    {
      method: 'DELETE',
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
