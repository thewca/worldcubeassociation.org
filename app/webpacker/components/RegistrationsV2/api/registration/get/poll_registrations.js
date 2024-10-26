import pollingMock from '../../mocks/polling_mock';
import { pollingRoute } from '../../../../../lib/requests/routes.js.erb';
import { fetchJsonOrError } from '../../../../../lib/requests/fetchWithAuthenticityToken';

export default async function pollRegistrations(
  userId,
  competition,
) {
  if (process.env.NODE_ENV === 'production') {
    const route = pollingRoute[competition.registration_version](userId, competition.id)
    const { data } = await fetchJsonOrError(route);
    return data;
  }
  return pollingMock(userId, competition);
}
