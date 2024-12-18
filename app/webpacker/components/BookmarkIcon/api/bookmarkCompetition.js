import { fetchWithAuthenticityToken } from '../../../lib/requests/fetchWithAuthenticityToken';
import { bookmarkUrl, unbookmarkUrl } from '../../../lib/requests/routes.js.erb';

export async function bookmarkCompetition(competitionId) {
  return fetchWithAuthenticityToken(bookmarkUrl, {
    method: 'POST',
    body: JSON.stringify({ id: competitionId }),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export async function unbookmarkCompetition(competitionId) {
  return fetchWithAuthenticityToken(unbookmarkUrl, {
    method: 'POST',
    body: JSON.stringify({ id: competitionId }),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
