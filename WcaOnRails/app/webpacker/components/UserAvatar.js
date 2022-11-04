import React from 'react';
import { Popup } from 'semantic-ui-react';

import '../stylesheets/user_avatar.scss';

function UserAvatar({
  avatar = { url: '', pending_url: '', thumb_url: '' },
  avatarClass = '',
  title = '',
  size = 'medium',
}) {
  const { url, thumb_url: thumbUrl, thumb } = avatar;
  // The avatar thumbnail url is at thumb_url for officers but at thumb.url for team members.
  const thumbnailUrl = thumbUrl || thumb.url || url;

  if (!['small', 'medium', 'large'].includes(size)) {
    throw new Error(`Invalid size: ${size} must be one of 'small', 'medium', or 'large'`);
  }

  const image = (
    <div
      className={`user-avatar-image-${size} ${avatarClass}`}
      style={{ backgroundImage: `url(${thumbnailUrl})` }}
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
