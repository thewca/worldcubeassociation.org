import { fetchJsonOrError } from '../../../lib/requests/fetchWithAuthenticityToken';
import { usersUrl } from '../../../lib/requests/routes.js.erb';
// eslint-disable-next-line import/prefer-default-export
export async function getPersons(page, region, query) {
  const { data } = await fetchJsonOrError(
    `${usersUrl}?search=${query}&sort=name&order=asc&offset=${(page - 1) * 10}&limit=10&region=${region ?? 'all'}`,
    {
      headers: {
        Accept: 'application/json, text/javascript, */*; q=0.01',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    },
  );
  return data;
}
