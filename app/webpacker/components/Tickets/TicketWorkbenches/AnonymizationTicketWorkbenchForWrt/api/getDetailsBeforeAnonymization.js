import { fetchJsonOrError } from '../../../../../lib/requests/fetchWithAuthenticityToken';
import { actionUrls } from '../../../../../lib/requests/routes.js.erb';

export default async function getDetailsBeforeAnonymization(userId, wcaId) {
  const { data } = await fetchJsonOrError(
    actionUrls.tickets.getDetailsBeforeAnonymization(userId, wcaId),
  );
  return data;
}
