import { getRegistrationConfigUrl } from '../../../../../lib/requests/routes.js.erb';
import { fetchJsonOrError } from '../../../../../lib/requests/fetchWithAuthenticityToken';

export default async function getRegistrationConfig(
  competition,
) {
  const route = getRegistrationConfigUrl(competition.id);
  const { data } = await fetchJsonOrError(route);
  return data;
}
