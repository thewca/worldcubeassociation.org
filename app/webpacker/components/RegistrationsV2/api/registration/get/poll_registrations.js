import externalServiceFetch from '../../helper/external_service_fetch';
import pollingMock from '../../mocks/polling_mock';
import { pollingRoute } from '../../../../../lib/requests/routes.js.erb';

export async function pollRegistrations(
  userId,
  competitionId,
) {
  if (process.env.NODE_ENV === 'production') {
    return externalServiceFetch(pollingRoute(userId, competitionId));
  }
  return pollingMock(userId, competitionId);
}
