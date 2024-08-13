import React from 'react';
import { Popup } from 'semantic-ui-react';

import '../stylesheets/user_avatar.scss';
import CroppedImage from './EditAvatar/CroppedImage';

function UserAvatar({
  avatar = {},
  avatarClass = '',
  title = '',
  size = 'medium',
  disableHover = false,
}) {
  const { url, thumbnail_url: thumbUrl } = avatar;

  if (!['tiny', 'small', 'medium', 'large'].includes(size)) {
    throw new Error(`Invalid size: ${size} must be one of 'small', 'medium', or 'large'`);
  }

  const cropAbs = {
    x: avatar.thumbnail_crop_x,
    y: avatar.thumbnail_crop_y,
    width: avatar.thumbnail_crop_w,
    height: avatar.thumbnail_crop_h,
    unit: 'px',
  };

  const backgroundStyle = thumbUrl && {
    backgroundImage: `url(${thumbUrl})`,
    backgroundSize: 'cover',
  };

  const image = (
    <div
      className={`user-avatar-image-${size} ${avatarClass}`}
      title={title}
      style={backgroundStyle}
    >
      {!thumbUrl && (
        <CroppedImage
          crop={cropAbs}
          src={url}
        />
      )}
    </div>
  );

  if (disableHover || !url) {
    return image;
  }

  return (
    <Popup
      trigger={image}
      flowing
      hoverable
    >
      <img alt="avatar" src={url} width="200" />
      {!!title && <h3>{title}</h3>}
    </Popup>
  );
}

export default UserAvatar;
