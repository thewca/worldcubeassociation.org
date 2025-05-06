import fetchWithJWTToken from '../../../../../lib/requests/fetchWithJWTToken';
import { paymentTicketUrl } from '../../../../../lib/requests/routes.js.erb';

export default async function getPaymentTicket(
  competition,
  donationAmount,
  paymentIntegration,
) {
  const route = paymentTicketUrl(competition.id, donationAmount, paymentIntegration);
  const { data } = await fetchWithJWTToken(route, {
    method: 'GET',
  });
  return data;
}
