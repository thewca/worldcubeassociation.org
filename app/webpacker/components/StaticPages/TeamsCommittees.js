import React, { useState } from 'react';
import { Button, Icon, Popup } from 'semantic-ui-react';
import I18n from '../../lib/i18n';
import UserBadge, { subtextForMember } from '../UserBadge';
import '../../stylesheets/static_pages/teams_committees.scss';

function Team({ team }) {
  const [hoveringEmail, setHoveringEmail] = useState(false);

  return (
    <div className="team" id={team.acronym}>
      <h3>
        <span className="name">{team.name}</span>
        {team.acronym && team.acronym !== 'BOARD' && (
          <span className="acronym">
            (
            {team.acronym}
            )
          </span>
        )}
        <Popup
          content="Copy to Clipboard"
          trigger={(
            <Button
              onClick={() => navigator.clipboard.writeText(team.email)}
              className="team-mail-button"
              size="big"
              icon
              onMouseEnter={() => setHoveringEmail(true)}
              onMouseLeave={() => setHoveringEmail(false)}
            >
              <Icon name={hoveringEmail ? 'copy' : 'mail'} />
              <span className="team-mail-email">{team.email}</span>
            </Button>
            )}
        />
      </h3>

      <p>{I18n.t(`about.structure.${team.friendly_id}.description`)}</p>

      <div className="team-members">
        {team.current_members
          .sort((a, b) => a.name.localeCompare(b.name))
          .sort((a, b) => (b.senior_member - a.senior_member))
          .sort((a, b) => (b.leader - a.leader))
          .map((user) => (
            <div key={team.id.toString() + user.id.toString()}>
              <UserBadge
                user={user}
                leader={user.leader}
                senior={user.senior_member}
                subtexts={subtextForMember(user)}
              />
            </div>
          ))}
      </div>
    </div>
  );
}

function TeamsCommittees({ teams = [] }) {
  return (
    <div className="teams-committees">
      <h1>{I18n.t('about.structure.teams_committees_councils')}</h1>
      <p>
        {I18n.t('about.structure.committees')}
      </p>

      {teams.map((team) => <Team team={team} key={team.id} />)}
    </div>
  );
}

export default TeamsCommittees;
