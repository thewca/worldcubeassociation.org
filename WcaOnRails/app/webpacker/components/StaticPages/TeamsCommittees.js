import React from 'react';
import I18n from '../../lib/i18n';
import UserAvatar from '../UserAvatar';

function User({ user }) {
  return (
    <div className="badge team-member-badge officer-badge" key={(user.wca_id || 'user') + user.id}>
      <UserAvatar avatar={user.avatar} />
      {JSON.stringify(user)}
    </div>
  );
}

function TeamsCommittees({ officers = [] }) {
  console.log(officers);
  return (
    <>
      <h1>{I18n.t('about.structure.teams_committees_councils')}</h1>
      <p>
        {I18n.t('about.structure.committees')}
      </p>

      <h3 id="officers">{I18n.t('about.structure.officers.name')}</h3>
      <p>{I18n.t('about.structure.officers.description')}</p>
      <br />

      <div className="officer-container">
        {officers.map((user) => (
          <div key={(user.wca_id || 'user') + user.id}>
            <User user={user} />
          </div>
        ))}
      </div>
    </>
  );
}

export default TeamsCommittees;
