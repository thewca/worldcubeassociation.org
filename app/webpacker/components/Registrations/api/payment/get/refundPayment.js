import { fetchJsonOrError } from '../../../../../lib/requests/fetchWithAuthenticityToken';
import { refundPaymentUrl } from '../../../../../lib/requests/routes.js.erb';

export default async function refundPayment({
  registrationId,
  paymentId,
  paymentProvider,
  amount,
}) {
  const { data } = await fetchJsonOrError(
    refundPaymentUrl(registrationId, paymentProvider, paymentId),
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

  return data;
}
