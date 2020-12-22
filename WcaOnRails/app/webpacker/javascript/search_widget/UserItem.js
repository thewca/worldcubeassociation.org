import React from 'react';

import { Image } from 'semantic-ui-react';
import './UserItem.scss';

const UserItem = ({
  item,
}) => (
  <div className="omnisearch-item-user">
    <Image src={item.avatar.thumb_url} />
    <div className="details">
      <span>{item.name}</span>
      {item.wca_id && (
        <span className="wca-id">{item.wca_id}</span>
      )}
    </div>
  </div>
);

export default UserItem;
