import { fetchJsonOrError } from '../../../../../lib/requests/fetchWithAuthenticityToken';
import { viewUrls } from '../../../../../lib/requests/routes.js.erb';

export default async function getCronjobDetails({ cronjobName }) {
  const { data } = await fetchJsonOrError(
    viewUrls.cronjob.details(cronjobName),
  );
  return data;
}
