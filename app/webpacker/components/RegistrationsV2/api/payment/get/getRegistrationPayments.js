import fetchWithJWTToken from '../../../../../lib/requests/fetchWithJWTToken';
import { registrationPaymentsUrl } from '../../../../../lib/requests/routes.js.erb';

export default async function getRegistrationPayments(
  registrationId,
) {
  const route = registrationPaymentsUrl(registrationId);
  const { data } = await fetchWithJWTToken(route);
  return data;
}
