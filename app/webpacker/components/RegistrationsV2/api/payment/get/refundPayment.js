import { fetchJsonOrError } from '../../../../../lib/requests/fetchWithAuthenticityToken';
import { paymentRefundsUrl } from '../../../../../lib/requests/routes.js.erb';

export default async function refundPayment({
  competitionId,
  paymentId,
  amount,
}) {
  return fetchJsonOrError(
    paymentRefundsUrl(competitionId, paymentId),
    {
      payment: {
        refund_amount: amount,
      },
    },
  );
}
