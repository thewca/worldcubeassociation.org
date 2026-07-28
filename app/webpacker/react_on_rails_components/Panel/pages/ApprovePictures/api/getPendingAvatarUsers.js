import { fetchJsonOrError } from '../../../../../lib/requests/fetchWithAuthenticityToken';
import { getPendingAvatarUrl } from '../../../../../lib/requests/routes.js.erb';

export default async function getPendingAvatarUsers() {
  const { data } = await fetchJsonOrError(getPendingAvatarUrl);
  return data;
}
