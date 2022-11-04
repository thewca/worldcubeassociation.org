import React from 'react';
import { Popup } from 'semantic-ui-react';

import '../stylesheets/user_avatar.scss';

function UserAvatar({
  avatar = { url: '', pending_url: '', thumb_url: '' },
  avatarClass = '',
  title = '',
  size = 50,
}) {
  const { url, thumb_url: thumbnailUrl, thumb } = avatar;

  const image = (
    <div
      className={`user-avatar-image ${avatarClass}`}
      style={{
        backgroundImage: `url(${thumbnailUrl || thumb.url || url})`,
        width: size,
      }}
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
