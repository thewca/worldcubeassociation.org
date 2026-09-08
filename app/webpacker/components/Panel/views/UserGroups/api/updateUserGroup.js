import { fetchJsonOrError } from '../../../../../lib/requests/fetchWithAuthenticityToken';
import { userGroupsUpdateUrl } from '../../../../../lib/requests/routes.js.erb';

export default async function updateUserGroup({ id, ...updateData }) {
  const { data } = await fetchJsonOrError(
    userGroupsUpdateUrl(id),
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    },
  );
  return data;
}
