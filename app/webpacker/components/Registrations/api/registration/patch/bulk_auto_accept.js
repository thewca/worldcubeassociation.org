import { fetchJsonOrError } from '../../../../../lib/requests/fetchWithAuthenticityToken';
import { bulkAutoAcceptUrl } from '../../../../../lib/requests/routes.js.erb';

export default async function bulkAutoAccept(competitionId) {
  const route = bulkAutoAcceptUrl(competitionId);
  const { data } = await fetchJsonOrError(route, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return data;
}
