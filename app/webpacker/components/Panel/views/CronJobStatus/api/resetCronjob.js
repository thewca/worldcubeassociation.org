import { fetchJsonOrError } from '../../../../../lib/requests/fetchWithAuthenticityToken';
import { actionUrls } from '../../../../../lib/requests/routes.js.erb';

export default async function resetCronjob({ cronjobName }) {
  const { data } = await fetchJsonOrError(
    actionUrls.cronjob.reset(cronjobName),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );
  return data;
}
