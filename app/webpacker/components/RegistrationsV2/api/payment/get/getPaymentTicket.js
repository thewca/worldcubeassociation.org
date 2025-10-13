import fetchWithJWTToken from '../../../../../lib/requests/fetchWithJWTToken';
import { paymentTicketUrl } from '../../../../../lib/requests/routes.js.erb';

export default async function getPaymentTicket(
  registrationId,
  donationAmount,
) {
  const route = paymentTicketUrl(registrationId, donationAmount);
  const { data } = await fetchWithJWTToken(route, {
    method: 'GET',
  });
  return data;
}
