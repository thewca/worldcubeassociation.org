import React from 'react';

import I18n from '../../lib/i18n';

function ROOverview({
  orgs,
}) {
  if (orgs == null) {
    return (
      <>
        <h1>{I18n.t('regional_organizations.title')}</h1>
        <p>{I18n.t('regional_organizations.empty')}</p>
      </>
    );
  }

  return (
    <>
      <h1>{I18n.t('regional_organizations.title')}</h1>
      <p>{I18n.t('regional_organizations.content')}</p>
      <div className="organizations-list">
        {orgs.map((org) => (
          <div key={org.name} className="organization-box">
            <a target="_blank" rel="noreferrer" className="hide-new-window-icon" href={org.website}>
              <img src={org.logo} alt="" />
              <div className={`organization-info${org.logo ? ' hide-until-hover' : ''}`}>
                <div className="country">
                  {org.country}
                </div>
                <div className="name">
                  {org.name}
                </div>
              </div>
            </a>
          </div>
        ))}
      </div>

      <h2>{I18n.t('regional_organizations.how_to.title')}</h2>
      <p>{I18n.t('regional_organizations.how_to.description')}</p>

      <h3>{I18n.t('regional_organizations.requirements.title')}</h3>
      <ol>
        <li>{I18n.t('regional_organizations.requirements.list.1')}</li>
        <li>{I18n.t('regional_organizations.requirements.list.2')}</li>
        <li>{I18n.t('regional_organizations.requirements.list.3')}</li>
        <li>{I18n.t('regional_organizations.requirements.list.4')}</li>
        <li>{I18n.t('regional_organizations.requirements.list.5')}</li>
        <li>{I18n.t('regional_organizations.requirements.list.6')}</li>
      </ol>

      <h3>{I18n.t('regional_organizations.application_instructions.title')}</h3>
    </>
  );
}

export default ROOverview;
