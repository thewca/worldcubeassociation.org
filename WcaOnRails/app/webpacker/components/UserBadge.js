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

  return '';
}

export function subtextForOfficer(user, officerTitles) {
  const positions = user.teams
    .map((team) => {
      const title = officerTitles.find((t) => t.friendly_id === team.friendly_id);
      if (title) return title.name;
      return null;
    })
    .filter(Boolean);

  if (user.teams.filter((team) => team.friendly_id === 'wfc' && team.leader).length > 0) {
    positions.push(I18n.t('about.structure.treasurer.name'));
  }

  return positions.map((position) => (
    <div key={position}>{position}</div>
  ));
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
              <b>{user.name}</b>
              {subtext && <div className="subtext">{subtext}</div>}
            </Button>
          )}
        />
      ) : (
        <div className="user-name ui button user-name-no-link">
          <b>{user.name}</b>
          {subtext && <div className="subtext">{subtext}</div>}
        </div>
      )}
    </Button>
  );
}

export default UserBadge;
