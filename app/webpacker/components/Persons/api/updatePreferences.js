import { fetchWithAuthenticityToken } from '../../../lib/requests/fetchWithAuthenticityToken';
import { updatePreferencesUrl } from '../../../lib/requests/routes.js.erb';

// eslint-disable-next-line import/prefer-default-export
export async function updatePreferences({
  userId, preferredEventIds, resultsNotificationsEnabled, registrationNotificationsEnabled,
}) {
  const { data } = await fetchWithAuthenticityToken(
    updatePreferencesUrl(userId),
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        preferred_event_ids: preferredEventIds,
        results_notifications_enabled: resultsNotificationsEnabled,
        registration_notifications_enabled: registrationNotificationsEnabled,
      }),
    },
  );
  return data;
}
