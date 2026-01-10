import { getRegistrationConfigUrl } from '../../../../../lib/requests/routes.js.erb';
import { fetchJsonOrError } from '../../../../../lib/requests/fetchWithAuthenticityToken';

export default async function getRegistrationConfig(
  competitionId,
) {
  const route = getRegistrationConfigUrl(competitionId);
  const { data } = await fetchJsonOrError(route);
  return data;
}
