import React from 'react';
import { Popup } from 'semantic-ui-react';

function UserAvatar({
  avatar = { url: '', pending_url: '' },
  showPending = false,
  doNotShowFullImageOnHover = false,
  avatarClass = '',
  breakCache = false,
  title = '',
}) {
  let url = showPending ? avatar.pending_url : avatar.url;

  if (breakCache) url += `?${Date.now()}`;

  const image = (
    <div
      className={`avatar-thumbnail ${avatarClass}`}
      style={{ backgroundImage: `url(${url})` }}
      title={title}
    />
  );

  if (!url && !doNotShowFullImageOnHover) {
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
