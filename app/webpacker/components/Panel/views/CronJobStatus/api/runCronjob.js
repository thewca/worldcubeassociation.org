import { fetchJsonOrError } from '../../../../../lib/requests/fetchWithAuthenticityToken';
import { actionUrls } from '../../../../../lib/requests/routes.js.erb';

export default async function runCronjob({ cronjobClassName }) {
  const { data } = await fetchJsonOrError(
    actionUrls.cronjob.run(cronjobClassName),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );
  return data;
}
