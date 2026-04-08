import { fetchJsonOrError } from '../../../lib/requests/fetchWithAuthenticityToken';
import { actionUrls } from '../../../lib/requests/routes.js.erb';

export default async function importRegistrations({ competitionId, registrations }) {
  const { data } = await fetchJsonOrError(
    actionUrls.competition.importRegistrations(competitionId),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registrations }),
    },
  );

  return data;
}
