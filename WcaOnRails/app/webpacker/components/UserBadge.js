import React from 'react';
import { Button, Label } from 'semantic-ui-react';
import UserAvatar from './UserAvatar';
import I18n from '../lib/i18n';

import '../stylesheets/user_badge.scss';

function UserBadge({
  user, subtext = '', background = '', badgeClasses = '',
}) {
  const classes = `user-badge ${badgeClasses} ${user.leader ? 'leader' : ''} ${user.senior_member ? 'senior' : ''}`;
  return (
    <Button as="div" className={classes} labelPosition="left">
      <Label style={{ backgroundColor: background }}>
        <UserAvatar avatar={user.avatar} />
      </Label>
      {user.wca_id ? (
        <Button
          as="a"
          href={`/persons/${user.wca_id}`}
          title={I18n.t('about.structure.users.profile', { user_name: user.name })}
          data-trigger="hover"
          data-toggle="tooltip"
          data-placement="bottom"
          className="user-name"
        >
          {user.name}
          <br />
          {subtext && <span className="subtext">{subtext}</span>}
        </Button>
      ) : (
        <Button
          as="a"
          className="user-name"
        >
          {user.name}
          <br />
          {subtext && <span className="subtext">{subtext}</span>}
        </Button>
      )}
    </Button>
  );
}

export default UserBadge;
