import { fetchJsonOrError } from '../../../../../lib/requests/fetchWithAuthenticityToken';
import { apiV0Urls } from '../../../../../lib/requests/routes.js.erb';

export default async function getUsersInfo(
  userIds,
) {
  // safeguard for when there is nothing to query.
  // Rails blows up with an empty param array so we cannot do this check in the backend.
  if (userIds.length === 0) {
    return [];
  }

  const { data } = await fetchJsonOrError(apiV0Urls.users.show(userIds));
  return data;
}
