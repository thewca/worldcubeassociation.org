import { fetchJsonOrError } from '../../../lib/requests/fetchWithAuthenticityToken';
import { viewUrls } from '../../../lib/requests/routes.js.erb';

export default async function getUserDetails(userId) {
  const { data } = await fetchJsonOrError(
    viewUrls.users.showForEdit(userId),
  );

  const userDetails = {
    id: data.id,
    name: data.name,
    dob: data.dob,
    gender: data.gender,
    country_iso2: data.country_iso2,
  };

  return userDetails;
}
