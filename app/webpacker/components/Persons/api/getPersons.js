import { fetchJsonOrError } from '../../../lib/requests/fetchWithAuthenticityToken';
import { personsUrl } from '../../../lib/requests/routes.js.erb';
// eslint-disable-next-line import/prefer-default-export
export async function getPersons(page, region, query) {
  const { data } = await fetchJsonOrError(
    `${personsUrl}?search=${query}&order=asc&offset=${(page - 1) * 10}&limit=10&region=${region ?? 'all'}`,
    {
      headers: {
        Accept: 'application/json',
      },
    },
  );
  return data;
}
