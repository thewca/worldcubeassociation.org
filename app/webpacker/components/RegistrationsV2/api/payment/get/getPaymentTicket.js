import { fetchJsonOrError } from '../../../../../lib/requests/fetchWithAuthenticityToken';
import { paymentTicketUrl } from '../../../../../lib/requests/routes.js.erb';

export default async function getPaymentTicket(
  registrationId,
  donationAmount,
) {
  const route = paymentTicketUrl(registrationId, donationAmount);
  const { data } = await fetchJsonOrError(route, {
    method: 'GET',
  });
  return data;
}
