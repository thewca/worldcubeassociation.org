import fetchWithJWTToken from '../../../../../lib/requests/fetchWithJWTToken';

export default async function getUsersInfo(
  userIds,
) {
  // safeguard for when there is nothing to query.
  // Rails blows up with an empty param array so we cannot do this check in the backend.
  if (userIds.length === 0) {
    return [];
  }

  const { data } = await fetchWithJWTToken('/api/v1/users', {
    body: JSON.stringify({ ids: userIds }),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return data;
}
