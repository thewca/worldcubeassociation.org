import { fetchJsonOrError } from '../../../../../lib/requests/fetchWithAuthenticityToken';
import { refundPaymentUrl } from '../../../../../lib/requests/routes.js.erb';

export default async function refundPayment({
  competitionId,
  userId,
  paymentId,
  amount,
}) {
  return fetchJsonOrError(
    refundPaymentUrl(competitionId, userId, paymentId, amount),
  );
}
