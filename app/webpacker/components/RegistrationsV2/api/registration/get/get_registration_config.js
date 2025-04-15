import fetchWithJWTToken from '../../../../../lib/requests/fetchWithJWTToken';
import { getRegistrationConfigUrl } from '../../../../../lib/requests/routes.js.erb';

export default async function getRegistrationConfig(
  userId,
  competition,
) {
  const route = getRegistrationConfigUrl(competition.id, userId);
  const { data } = await fetchWithJWTToken(route);
  return data;
}
