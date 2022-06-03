import React from 'react';

import I18n from '../../lib/i18n';

function HasOrganizations({
  orgs,
}) {
  if (orgs) {
    return (
      <>
        <p>{I18n.t('regional_organizations.content')}</p>
        <div className="organizations-list">
          {orgs.map((org) => (
            <a key={org.logo} href={org.website}>
              <img src={org.logo} width={300} height={100} alt="" />
              <div className={`organization-info ${org.logo ? 'hide-until-hover' : ''}`}>
                <div className="country">
                  <p key={org.country}>{org.country}</p>
                </div>
                <div className="name">
                  <p key={org.name}>{org.name}</p>
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
      </>
    );
  }

  return <p>{I18n.t('regional_organizations.empty')}</p>;
}

function ROOverview({
  orgs,
}) {
  // TODO: find a proper way to <%= provide %> the "| World Cube Association" title part
  const title = I18n.t('regional_organizations.title');
  document.title = `${title} | World Cube Association`;
  return (
    <div className="container">
      <h1>{title}</h1>
      <HasOrganizations orgs={orgs} />
    </div>
  );
}

export default ROOverview;
