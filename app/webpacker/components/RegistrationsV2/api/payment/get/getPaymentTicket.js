import fetchWithJWTToken from '../../../../../lib/requests/fetchWithJWTToken';
import { paymentTicketUrl } from '../../../../../lib/requests/routes.js.erb';

export default async function getPaymentTicket(
  competition,
  donationAmount,
) {
  const route = paymentTicketUrl(competition.id, donationAmount);
  const { data } = await fetchWithJWTToken(route, {
    method: 'GET',
  });
  return data;
}
