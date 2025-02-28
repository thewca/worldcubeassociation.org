import { fetchJsonOrError } from '../../../../../lib/requests/fetchWithAuthenticityToken';
import { viewUrls } from '../../../../../lib/requests/routes.js.erb';

export default async function getCronjobDetails({ cronjobClassName }) {
  const { data } = await fetchJsonOrError(
    viewUrls.cronjob.details(cronjobClassName),
  );
  return data;
}
