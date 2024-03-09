import React from 'react';

import '../../stylesheets/search_widget/UserItem.scss';
import UserItem from './UserItem';
import I18n from '../../lib/i18n';

export default function UserRoleItem({
  item,
}) {
  return (
    <UserItem
      item={item.user}
      description={`${I18n.t(`enums.user.role_status.delegate_regions.${item.metadata.status}`)}, ${item.group.name}`}
    />
  );
}
