import { fetchJsonOrError } from '../../../../../lib/requests/fetchWithAuthenticityToken';
import { fetchUserGroupUrl } from '../../../../../lib/requests/routes.js.erb';

export default async function readUserGroup({ id }) {
  const { data } = await fetchJsonOrError(fetchUserGroupUrl(id));
  return data;
}
