import React from 'react';
import {
  Button, Icon, Label, Popup,
} from 'semantic-ui-react';
import classnames from 'classnames';
import UserAvatar from './UserAvatar';
import I18n from '../lib/i18n';

import '../stylesheets/user_badge.scss';

function UserBadge({
  user,
  subtexts = [],
  background = '',
  badgeClasses = '',
  size = 'medium',
  senior = false,
  leader = false,
  hideBorder = false,
  leftAlign = false,
}) {
  const classes = classnames('user-badge', badgeClasses, { senior, leader, 'left-align': leftAlign });

  const subtext = subtexts.length ? (
    <div className="subtext">
      {subtexts.map((t, i) => (
        <div key={`${user.wca_id}-${t}-subtext-${i.toString()}`}>{t}</div>
      ))}
    </div>
  ) : null;

  return (
    <Button as="div" className={classes} labelPosition="left">
      <Label style={{ backgroundColor: background }} className="user-badge-label-avatar">
        <UserAvatar
          avatar={user.avatar}
          avatarClass="user-avatar-rounded-left"
          size={size}
        />
      </Label>
      {user.wca_id ? (
        <Popup
          content={I18n.t('about.structure.users.profile', { user_name: user.name })}
          trigger={(
            <Button
              as="a"
              href={`/persons/${user.wca_id}`}
              className={`user-name ${!hideBorder ? 'show-border' : ''}`}
            >
              <b>
                {user.name}
                <Icon name="user circle outline" />
              </b>
              <div className="user-badge-subtext">{subtext}</div>
            </Button>
          )}
        />
      ) : (
        <div className="user-name ui button user-name-no-link">
          <b>{user.name}</b>
          <div className="user-badge-subtext">{subtext}</div>
        </div>
      )}
    </Button>
  );
}

export default UserBadge;
