import fetchWithJWTToken from '../../../../../lib/requests/fetchWithJWTToken';
import { bulkAutoAcceptUrl } from '../../../../../lib/requests/routes.js.erb';

export default async function bulkAutoAccept(competitionId) {
  const route = bulkAutoAcceptUrl(competitionId);
  const { data } = await fetchWithJWTToken(route, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return data;
}
