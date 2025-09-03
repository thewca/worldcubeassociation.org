import { getRegistrationConfigUrl } from '../../../../../lib/requests/routes.js.erb';
import fetchWithJWTToken from '../../../../../lib/requests/fetchWithJWTToken';

export default async function getRegistrationConfig(
  competitionId,
) {
  const route = getRegistrationConfigUrl(competitionId);
  const { data } = await fetchWithJWTToken(route);
  return data;
}
