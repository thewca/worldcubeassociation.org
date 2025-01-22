import { fetchJsonOrError } from '../../../lib/requests/fetchWithAuthenticityToken';
import { generateBackupCodesUrl } from '../../../lib/requests/routes.js.erb';

// eslint-disable-next-line import/prefer-default-export
export async function getBackupCodes() {
  const { data } = await fetchJsonOrError(
    generateBackupCodesUrl(),
    { method: 'POST', 'Content-Type': 'application/json' },
  );

  return data;
}
