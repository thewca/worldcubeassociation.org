import { fetchJsonOrError } from '../../../../lib/requests/fetchWithAuthenticityToken';
import { actionUrls } from '../../../../lib/requests/routes.js.erb';

export default async function createEditPersonField({
  ticketId,
  actingStakeholderId,
  fieldName,
  oldValue,
  newValue,
}) {
  const { data } = await fetchJsonOrError(
    actionUrls.tickets.editPersonFields(ticketId),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        acting_stakeholder_id: actingStakeholderId,
        field_name: fieldName,
        old_value: oldValue,
        new_value: newValue,
      }),
    },
  );
  return data;
}
