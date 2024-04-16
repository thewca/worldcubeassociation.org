import pollingMock from '../../mocks/polling_mock';
import { pollingRoute } from '../../../../../lib/requests/routes.js.erb';
import { fetchJsonOrError } from '../../../../../lib/requests/fetchWithAuthenticityToken';

export default async function pollRegistrations(
  userId,
  competitionId,
) {
  if (process.env.NODE_ENV === 'production') {
    return fetchJsonOrError(pollingRoute(userId, competitionId));
  }
  return pollingMock(userId, competitionId);
}
