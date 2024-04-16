import { paymentConfigRoute } from '../../../../../lib/requests/routes.js.erb';
import { fetchJsonOrError } from '../../../../../lib/requests/fetchWithAuthenticityToken';

export default async function getStripeConfig(
  competitionId,
  paymentId,
) {
  return fetchJsonOrError(paymentConfigRoute(competitionId, paymentId));
}
