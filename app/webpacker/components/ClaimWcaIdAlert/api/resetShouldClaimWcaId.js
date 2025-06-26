import { fetchJsonOrError } from '../../../lib/requests/fetchWithAuthenticityToken';
import { actionUrls } from '../../../lib/requests/routes.js.erb';

export default async function resetShouldClaimWcaId() {
  const { data } = await fetchJsonOrError(
    actionUrls.users.resetShouldClaimWcaId,
    { method: 'POST' },
  );
  return data;
}
