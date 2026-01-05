import _ from 'lodash';
import { fetchJsonOrError } from '../../../../../lib/requests/fetchWithAuthenticityToken';
import { apiV0Urls } from '../../../../../lib/requests/routes.js.erb';

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
      body: JSON.stringify(_.omitBy({
        userId,
        groupId,
        status,
        location,
      }, _.isNull)),
    },
  );
  return data;
}
