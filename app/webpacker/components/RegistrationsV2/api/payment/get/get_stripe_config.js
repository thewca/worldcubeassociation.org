import externalServiceFetch from '../../helper/external_service_fetch';
import { paymentConfigRoute } from '../../../../../lib/requests/routes.js.erb';

export default async function getStripeConfig(
  competitionId,
  paymentId,
) {
  return externalServiceFetch(paymentConfigRoute(competitionId, paymentId));
}
