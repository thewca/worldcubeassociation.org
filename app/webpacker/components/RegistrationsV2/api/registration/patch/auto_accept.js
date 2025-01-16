import fetchWithJWTToken from '../../../../../lib/requests/fetchWithJWTToken';
import { fetchJsonOrError } from '../../../../../lib/requests/fetchWithAuthenticityToken';
import { disableAutoAcceptUrl } from '../../../../../lib/requests/routes.js.erb';

export async function disableAutoAccept(competitionId) {
  const route = disableAutoAcceptUrl(competitionId);
  const { data } = await fetchJsonOrError(route, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return data;
}
