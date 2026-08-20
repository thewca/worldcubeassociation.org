import { fetchJsonOrError } from '../../../lib/requests/fetchWithAuthenticityToken';
import { viewUrls } from '../../../lib/requests/routes.js.erb';

export default async function getPendingClaims({ wcaId }) {
  const { data } = await fetchJsonOrError(
    viewUrls.users.pendingClaims(wcaId),
  );
  return data || [];
}
