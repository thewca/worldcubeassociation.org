import { fetchJsonOrError } from '../../../../../lib/requests/fetchWithAuthenticityToken';
import { apiV0Urls, omitNullAndUndefined } from '../../../../../lib/requests/routes.js.erb';

export default async function createUserRole({
  userId, groupId, status, location,
}) {
  const { data } = await fetchJsonOrError(
    apiV0Urls.userRoles.create(),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(omitNullAndUndefined({
        userId,
        groupId,
        status,
        location,
      })),
    },
  );
  return data;
}
