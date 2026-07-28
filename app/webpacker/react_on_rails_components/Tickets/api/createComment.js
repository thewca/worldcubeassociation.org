import { fetchJsonOrError } from '../../../lib/requests/fetchWithAuthenticityToken';
import { actionUrls } from '../../../lib/requests/routes.js.erb';

export default async function createComment({ ticketId, comment, currentStakeholder }) {
  const { data } = await fetchJsonOrError(
    actionUrls.tickets.addComment(ticketId),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ comment, acting_stakeholder_id: currentStakeholder.id }),
    },
  );
  return data;
}
