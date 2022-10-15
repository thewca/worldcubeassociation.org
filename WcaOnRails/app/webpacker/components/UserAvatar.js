import React from 'react';
import { Popup } from 'semantic-ui-react';

import '../stylesheets/user_avatar.scss';

function UserAvatar({
  avatar = { url: '', pending_url: '' },
  showPending = false,
  avatarClass = '',
  breakCache = false,
  title = '',
}) {
  let url = showPending ? avatar.pending_url : avatar.url;

  if (breakCache) url += `?${Date.now()}`;

  const image = (
    <div
      className={`user-avatar-image ${avatarClass}`}
      style={{ backgroundImage: `url(${url})` }}
      title={title}
    />
  );

  if (!url) {
    return image;
  }

  return (
    <Popup
      trigger={image}
      flowing
      hoverable
    >
      <img alt="avatar" src={url} width="200" />
    </Popup>
  );
}

export default UserAvatar;
