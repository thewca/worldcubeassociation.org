import React from 'react';
import { Button, Label, Popup } from 'semantic-ui-react';
import UserAvatar from './UserAvatar';
import I18n from '../lib/i18n';

import '../stylesheets/user_badge.scss';

export function subtextForMember(user) {
  if (user.leader) {
    return I18n.t('about.structure.leader');
  }
  if (user.senior_member) {
    return I18n.t('about.structure.senior_member');
  }
}

function UserBadge({
  user, subtext = '', background = '', badgeClasses = '', senior = false, leader = false,
}) {
  let classes = `user-badge ${badgeClasses}`;

  if (senior) {
    classes += ' senior';
  }
  if (leader) {
    classes += ' leader';
  }

  return (
    <Button as="div" className={classes} labelPosition="left">
      <Label style={{ backgroundColor: background }}>
        <UserAvatar avatar={user.avatar} />
      </Label>
      {user.wca_id ? (
        <Popup
          content={I18n.t('about.structure.users.profile', { user_name: user.name })}
          trigger={(
            <Button
              as="a"
              href={`/persons/${user.wca_id}`}
              className="user-name"
            >
              {user.name}
              {subtext && <div className="subtext">{subtext}</div>}
            </Button>
          )}
        />
      ) : (
        <Button
          as="a"
          className="user-name"
        >
          {user.name}
          {subtext && <div className="subtext">{subtext}</div>}
        </Button>
      )}
    </Button>
  );
}

export default UserBadge;
