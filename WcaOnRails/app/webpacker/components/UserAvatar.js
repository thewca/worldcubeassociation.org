import React from 'react';

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

  const showHover = url && !doNotShowFullImageOnHover;

  return (
    <div
      className={`avatar-thumbnail ${avatarClass}`}
      style={{ backgroundImage: `url(${url})` }}
      data-trigger={showHover ? 'hover' : ''}
      data-content={showHover ? `<img alt='avatar' src='${url}' />` : ''}
      data-toggle={showHover ? 'popover' : ''}
      data-html={showHover ? 'true' : ''}
      title={title}
    />
  );
}

export default UserAvatar;
