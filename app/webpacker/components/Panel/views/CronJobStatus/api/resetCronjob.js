import { fetchJsonOrError } from '../../../../../lib/requests/fetchWithAuthenticityToken';
import { actionUrls } from '../../../../../lib/requests/routes.js.erb';

export default async function resetCronjob({ cronjobClassName }) {
  const { data } = await fetchJsonOrError(
    actionUrls.cronjob.reset(cronjobClassName),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );
  return data;
}
