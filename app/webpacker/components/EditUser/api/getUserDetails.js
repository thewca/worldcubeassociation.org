import { fetchJsonOrError } from '../../../lib/requests/fetchWithAuthenticityToken';
import { viewUrls } from '../../../lib/requests/routes.js.erb';

export default async function getUserDetails(userId) {
  const { data } = await fetchJsonOrError(
    viewUrls.users.showForEdit(userId),
  );

  return data;
}
