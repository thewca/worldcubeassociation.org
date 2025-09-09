import fetchWithJWTToken from '../../../../../lib/requests/fetchWithJWTToken';
import { paymentTicketUrl } from '../../../../../lib/requests/routes.js.erb';

export default async function getPaymentTicket(
  registrationId,
  donationAmount,
  paymentIntegration,
) {
  const route = paymentTicketUrl(registrationId, donationAmount, paymentIntegration);
  const { data } = await fetchWithJWTToken(route, {
    method: 'GET',
  });
  return data;
}
