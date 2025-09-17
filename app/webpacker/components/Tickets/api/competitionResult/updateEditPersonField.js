import { fetchJsonOrError } from '../../../../lib/requests/fetchWithAuthenticityToken';
import { actionUrls } from '../../../../lib/requests/routes.js.erb';

export default async function updateEditPersonField({
  ticketId,
  actingStakeholderId,
  newValue,
  editPersonFieldId,
}) {
  const { data } = await fetchJsonOrError(
    actionUrls.tickets.editPersonField(ticketId, editPersonFieldId),
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        acting_stakeholder_id: actingStakeholderId,
        new_value: newValue,
      }),
    },
  );
  return data;
}
