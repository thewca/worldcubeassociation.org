import { fetchJsonOrError } from '../../../../../lib/requests/fetchWithAuthenticityToken';
import { paymentRefundsUrl } from '../../../../../lib/requests/routes.js.erb';

export default async function refundPayment({
  competitionId,
  userId,
  paymentId,
  amount,
}) {
  return fetchJsonOrError(
    paymentRefundsUrl(competitionId, userId, paymentId, amount),
  );
}
