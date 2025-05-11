import { fetchWithAuthenticityToken } from '../../../../../lib/requests/fetchWithAuthenticityToken';
import { updateAvatarUrl } from '../../../../../lib/requests/routes.js.erb';

export default async function updateAvatar({
  avatarId, action, rejectionGuidelines, rejectionReason,
}) {
  return fetchWithAuthenticityToken(updateAvatarUrl, {
    method: 'POST',
    body: JSON.stringify({
      avatar_id: avatarId,
      avatar_action: action,
      rejection_guidelines: rejectionGuidelines,
      rejection_reason: rejectionReason,
    }),
    headers: {
      'Content-type': 'application/json',
    },
  });
}
