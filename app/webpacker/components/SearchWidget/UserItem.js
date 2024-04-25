import React from 'react';

import { Image } from 'semantic-ui-react';
import '../../stylesheets/search_widget/UserItem.scss';

function UserItem({
  item,
  description,
}) {
  return (
    <div className="multisearch-item-user">
      <Image src={item.avatar.thumb_url} />
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
