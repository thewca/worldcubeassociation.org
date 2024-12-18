import { fetchWithAuthenticityToken } from '../../../../../lib/requests/fetchWithAuthenticityToken';
import { updateAvatarsUrl } from '../../../../../lib/requests/routes.js.erb';

export default async function updateAvatars(avatars) {
  return fetchWithAuthenticityToken(updateAvatarsUrl, {
    method: 'POST',
    body: JSON.stringify(avatars),
    headers: {
      'Content-type': 'application/json',
    },
  });
}
