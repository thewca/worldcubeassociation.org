import React from 'react';
import {
  Button, Icon, Label, Popup,
} from 'semantic-ui-react';
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
      if (title) return title.name;
      return '';
    })
    .filter(Boolean);

  if (user.teams.filter((team) => team.friendly_id === 'wfc' && team.leader).length > 0) {
    positions.push(I18n.t('about.structure.treasurer.name'));
  }

  return positions;
}

function UserBadge({
  user, subtexts = [], background = '', badgeClasses = '', senior = false, leader = false,
}) {
  let classes = `user-badge ${badgeClasses}`;

  if (senior) {
    classes += ' senior';
  }
  if (leader) {
    classes += ' leader';
  }

  let subtext = (
    <div className="subtext">
      {subtexts.map((t, i) => (
        <div key={`${user.wca_id}-${t}-subtext-${i.toString()}`}>{t}</div>
      ))}
    </div>
  );

  if (!subtexts.length) {
    subtext = null;
  }

  return (
    <Button as="div" className={classes} labelPosition="left">
      <Label style={{ backgroundColor: background }}>
        <UserAvatar avatar={user.avatar} avatarClass="rounded" />
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
              <b>
                {user.name}
                <Icon name="user circle outline" />
              </b>
              {subtext}
            </Button>
          )}
        />
      ) : (
        <div className="user-name ui button user-name-no-link">
          <b>{user.name}</b>
          {subtext}
        </div>
      )}
    </Button>
  );
}

export default UserBadge;
