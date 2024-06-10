import { fetchWithAuthenticityToken } from '../../../../../lib/requests/fetchWithAuthenticityToken';
import { refundPaymentUrl } from '../../../../../lib/requests/routes.js.erb';

export default async function refundPayment({
  competitionId,
  paymentId,
  amount,
}) {
  return fetchWithAuthenticityToken(
    refundPaymentUrl(competitionId, paymentId),
    {
      body:
        JSON.stringify({
          payment: {
            refund_amount: amount,
          },
        }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
  );
}
