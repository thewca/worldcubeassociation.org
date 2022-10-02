import React from 'react';
import { Button, Icon, Popup } from 'semantic-ui-react';
import I18n from '../../lib/i18n';
import UserBadge, {subtextForMember} from '../UserBadge';
import '../../stylesheets/static_pages/teams_committees.scss';

function TeamsCommittees({ officers = [], teams = [] }) {
  console.log(teams);
  return (
    <>
      <h1>{I18n.t('about.structure.teams_committees_councils')}</h1>
      <p>
        {I18n.t('about.structure.committees')}
      </p>

      <h3 id="officers">{I18n.t('about.structure.officers.name')}</h3>
      <p>{I18n.t('about.structure.officers.description')}</p>

      <div className="team-members">
        {officers.map((user) => (
          <div key={(user.wca_id || 'user') + user.id}>
            <UserBadge user={user} badgeClasses="board" />
          </div>
        ))}
      </div>

      {teams.map((team) => (
        <div className="team" key={team.id}>
          <h3>
            <span className="name">{team.name}</span>
            {team.acronym && team.acronym !== 'BOARD' && (
              <span className="acronym">
                {team.acronym ? `(${team.acronym})` : ''}
              </span>
            )}
            <Popup
              trigger={<Button className="team-mail-button" size="big" icon="mail" href={`mailto:${team.email}`} />}
              flowing
              hoverable
            >
              <Popup
                content="Copy to Clipboard"
                trigger={(
                  <Icon
                    name="copy"
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigator.clipboard.writeText(team.email)}
                  />
                )}
              />
              {team.email}
            </Popup>
          </h3>

          <p>{I18n.t(`about.structure.${team.friendly_id}.description`)}</p>

          <div className="team-members">
            {team.current_members
              .sort((a, b) => a.name.localeCompare(b.name))
              .sort((a) => (a.senior_member ? -1 : 1))
              .sort((a) => (a.leader ? -1 : 1))
              .map((user) => (
                <div key={team.id.toString() + user.id.toString()}>
                  <UserBadge
                    user={user}
                    leader={user.leader}
                    senior={user.senior_member}
                    subtext={subtextForMember(user)}
                  />
                </div>
              ))}
          </div>
        </div>
      ))}
    </>
  );
}

export default TeamsCommittees;
