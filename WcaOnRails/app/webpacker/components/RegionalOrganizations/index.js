import React from 'react';

import I18n from '../../lib/i18n';

function HasOrganizations({
  orgs, imgs,
}) {
  if (orgs) {
    return (
      <>
        <p>{I18n.t('regional_organizations.content')}</p>
        <div className="organizations-list">
          {orgs.map((org, index) => (
            <a target="_blank" rel="noreferrer" className="hide-new-window-icon" href={org.website}>
              <img src={imgs[index]} alt="" />
              <div className={`organization-info${imgs[index] ? ' hide-until-hover' : ''}`}>
                <div className="country">
                  {org.country}
                </div>
                <div className="name">
                  {org.name}
                </div>
              </div>
            </a>
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
        <p>{I18n.t('regional_organizations.application_instructions.description_html')}</p>
      </>
    );
  }

  return <p>{I18n.t('regional_organizations.empty')}</p>;
}

function ROOverview({
  orgs, imgs,
}) {
  const title = I18n.t('regional_organizations.title');
  document.title = `${title} | World Cube Association`;
  return (
    <div className="container">
      <h1>{title}</h1>
      <HasOrganizations orgs={orgs} imgs={imgs} />
    </div>
  );
}

export default ROOverview;
