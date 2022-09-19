import React from 'react';
import I18n from '../../lib/i18n';
import UserBadge from '../UserBadge';

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
      <br />

      <div className="team-members">
        {officers.map((user) => (
          <div key={(user.wca_id || 'user') + user.id}>
            <UserBadge user={user} badgeClasses="" />
          </div>
        ))}
      </div>

      {teams.map((team) => (
        <div className="team" key={team.id}>
          <h3 id={team.acronym}>
            <span className="name">{team.name}</span>
            {team.acronym && team.acronym !== 'BOARD' && (
              <span className="acronym">
                {team.acronym ? `(${team.acronym})` : ''}
              </span>
            )}
          </h3>

          <p>{I18n.t(`about.structure.${team.friendly_id}.description`)}</p>
          <br />

          <div className="team-members">
            {team.current_members.map((user) => (
              <div key={team.id.toString() + user.id.toString()}>
                <UserBadge user={user} badgeClasses="" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

export default TeamsCommittees;
