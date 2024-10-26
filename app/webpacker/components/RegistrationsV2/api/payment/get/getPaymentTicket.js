import fetchWithJWTToken from "../../../../../lib/requests/fetchWithJWTToken";
import {registrationRoutes} from "../../routes";

export default async function getPaymentTicket(
  competition,
  donationAmount,
) {
  const route = registrationRoutes[competition.registration_version].paymentTicketUrl(competition.id, donationAmount)
  const { data } = await fetchWithJWTToken(route, {
    method: 'GET',
  });
  return data;
}
