import React from 'react';

import I18n from '../../lib/i18n';
import I18nHTMLTranslate from '../I18nHTMLTranslate';

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
              <img src={org.logo_url} alt="" />
              <div className={`organization-info${org.logo_url ? ' hide-until-hover' : ''}`}>
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
        {I18n.tArray('regional_organizations.requirements.list').map((requirement, i) => (
          <li key={`regional_organizations.requirements.list.${i.toString()}`}>{requirement}</li>
        ))}
      </ol>

      <h3>{I18n.t('regional_organizations.application_instructions.title')}</h3>
      <p><I18nHTMLTranslate i18nKey="regional_organizations.application_instructions.description_html" /></p>
    </>
  );
}

export default ROOverview;
