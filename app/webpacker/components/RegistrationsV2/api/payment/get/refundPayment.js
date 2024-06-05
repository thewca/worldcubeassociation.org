import { fetchJsonOrError } from '../../../../../lib/requests/fetchWithAuthenticityToken';
import { refundPaymentUrl } from '../../../../../lib/requests/routes.js.erb';

export default async function refundPayment({
  competitionId,
  paymentId,
  amount,
}) {
  return fetchJsonOrError(
    refundPaymentUrl(competitionId, 'stripe', paymentId),
    {
      payment: {
        refund_amount: amount,
      },
    },
  );
}
