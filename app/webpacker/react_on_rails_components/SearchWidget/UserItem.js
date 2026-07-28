import React from 'react';

import UserAvatar from '../UserAvatar';
import '../../stylesheets/search_widget/UserItem.scss';

function UserItem({
  item,
  description,
}) {
  return (
    <div className="multisearch-item-user">
      <UserAvatar avatar={item.avatar} avatarClass="avatar-image" size="tiny" disableHover />
      <div className="details">
        <span>{item.name}</span>
        {item.wca_id && (
          <span className="wca-id">{item.wca_id}</span>
        )}
        {description && (
          <span>{description}</span>
        )}
      </div>
    </div>
  );
}

export default UserItem;
