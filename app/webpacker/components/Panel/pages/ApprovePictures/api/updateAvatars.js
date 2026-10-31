import { fetchWithAuthenticityToken } from '../../../../../lib/requests/fetchWithAuthenticityToken';
import { updateAvatarUrl } from '../../../../../lib/requests/routes.js.erb';

export default async function updateAvatar({
  avatarId, action, rejectionGuidelines, rejectionReason, includesAvatarPicture,
}) {
  return fetchWithAuthenticityToken(updateAvatarUrl, {
    method: 'POST',
    body: JSON.stringify({
      avatar_id: avatarId,
      avatar_action: action,
      rejection_guidelines: rejectionGuidelines,
      rejection_reason: rejectionReason,
      include_avatar_picture: includesAvatarPicture,
    }),
    headers: {
      'Content-type': 'application/json',
    },
  });
}
