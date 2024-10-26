import fetchWithJWTToken from '../../../../../lib/requests/fetchWithJWTToken';
import {registrationRoutes} from "../../routes";

export default async function submitEventRegistration(
  competition,
  body,
) {
  const route = registrationRoutes[competition.registration_version].submitRegistrationUrl;
  const { data } = await fetchWithJWTToken(route, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return data;
}
