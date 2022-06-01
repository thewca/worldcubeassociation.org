import React from 'react';

import I18n from '../../lib/i18n';

function DisplayOrganizations({
  orgs,
}) {
  const listOrgs = orgs.map((org) => <p>{org.name}</p>);
  return listOrgs;
}

function HasOrganizations({
  orgs,
}) {
  if (orgs) {
    return (
      <>
        <p>{I18n.t('regional_organizations.content')}</p>
        <div className="organizations-list">
          <DisplayOrganizations orgs={orgs} />
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
