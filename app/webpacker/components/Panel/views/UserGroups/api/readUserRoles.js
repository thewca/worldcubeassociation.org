import { fetchJsonOrError } from '../../../../../lib/requests/fetchWithAuthenticityToken';
import { apiV0Urls } from '../../../../../lib/requests/routes.js.erb';

export default async function readUserRoles({ groupId, isActive, isLead }) {
  const { data } = await fetchJsonOrError(apiV0Urls.userRoles.list({ groupId, isActive, isLead }));
  return data;
}
