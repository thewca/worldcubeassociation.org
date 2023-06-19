import React from 'react';
import {
  Button, Icon, Label, Popup,
} from 'semantic-ui-react';
import classnames from 'classnames';
import UserAvatar from './UserAvatar';
import I18n from '../lib/i18n';

import '../stylesheets/user_badge.scss';

/**
 * @param {{ leader: boolean, senior_member: boolean}} user
 * @returns {string[]}
 */
export function subtextForMember(user) {
  if (user.leader) {
    return [I18n.t('about.structure.leader')];
  }
  if (user.senior_member) {
    return [I18n.t('about.structure.senior_member')];
  }

  return [];
}

/**
 * @param {{ teams: { friendly_id: string, leader: boolean }[]}} user
 * @param {{ friendly_id: string, name: string }[]} officerTitles
 * @returns {string[]}
 */
export function subtextForOfficer(user, officerTitles) {
  const positions = user.teams
    .map((team) => {
      const title = officerTitles.find((t) => t.friendly_id === team.friendly_id);
      return title ? title.name : '';
    })
    .filter(Boolean);

  if (user.teams.filter((team) => team.friendly_id === 'wfc' && team.leader).length > 0) {
    positions.push(I18n.t('about.structure.treasurer.name'));
  }

  return positions;
}

function UserBadge({
  user,
  subtexts = [],
  background = '',
  badgeClasses = '',
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
