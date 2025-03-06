import { fetchJsonOrError } from '../../../../../lib/requests/fetchWithAuthenticityToken';
import { actionUrls } from '../../../../../lib/requests/routes.js.erb';

export default async function runCronjob({ cronjobName }) {
  const { data } = await fetchJsonOrError(
    actionUrls.cronjob.run(cronjobName),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );
  return data;
}
