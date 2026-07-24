import { fetchJsonOrError } from '../../../lib/requests/fetchWithAuthenticityToken';
import { personApiUrl } from '../../../lib/requests/routes.js.erb';

export default async function getPersonDetails(wcaId) {
  const { data } = await fetchJsonOrError(
    personApiUrl(wcaId),
  );

  return data.person;
}
