import getJWT from '../../components/RegistrationsV2/api/auth/get_jwt';
import FetchJsonError from './FetchJsonError';
import { EXPIRED_TOKEN } from '../../components/RegistrationsV2/api/helper/error_codes';

export default async function fetchWithJWTToken(url, fetchOptions) {
  const options = fetchOptions || {};
  if (!options.headers) {
    options.headers = {};
  }
  options.headers.Authorization = await getJWT();
  const response = await fetch(url, options);
  const json = await response.json();
  if (!response.ok) {
    if (response.error === EXPIRED_TOKEN) {
      await getJWT(true);
      return fetchWithJWTToken(url, fetchOptions);
    }
    throw new FetchJsonError(`${response.status}: ${response.statusText}\n${json.error}`, response, json);
  }
  return { data: json, headers: response.headers };
}
