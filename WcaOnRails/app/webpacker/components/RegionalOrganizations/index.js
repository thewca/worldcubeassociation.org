import React from 'react';

import I18n from '../../lib/i18n';

function HasOrganizations({
  orgs,
}) {
  if (orgs) {
    const hoverEffect = 'hide-until-hover';
    return (
      <>
        <p>{I18n.t('regional_organizations.content')}</p>
        <div className="organizations-list">
          {orgs.map((org) => (
            <a key={org.logo} href={org.website}>
              <img src={org.logo} width={300} height={100} alt="" />

              <div className={`organization-info | ${hoverEffect}`}>
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
    <>
      <h1>{title}</h1>
      <HasOrganizations orgs={orgs} />
    </>
  );
}

export default ROOverview;
