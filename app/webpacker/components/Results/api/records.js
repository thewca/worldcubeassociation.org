import { fetchJsonOrError } from '../../../lib/requests/fetchWithAuthenticityToken';
import { recordsUrl } from '../../../lib/requests/routes.js.erb';

// eslint-disable-next-line import/prefer-default-export
export async function getRecords(eventId, region, gender, show) {
  const { data } = await fetchJsonOrError(recordsUrl(eventId, region, gender, show), { headers: { Accept: 'application/json' } });
  return data;
}
