import React from 'react';
import I18n from '../../lib/i18n';
import I18nHTMLTranslate from '../I18nHTMLTranslate';
import '../../stylesheets/static_pages/logo.scss';

/**
 * @returns {JSX.Element}
 * @constructor
 */
function Logo({ title }) {
  return (
    <div className="wca-logo-information">
      <h1>{title}</h1>
      {Object.keys(I18n.t('logo.paragraphs')).map((key) => (
        <p key={`logo-paragraphs-${key}`}>
          <I18nHTMLTranslate
            i18nKey={`logo.paragraphs.${key}`}
          />
        </p>
      ))}
    </div>
  );
}

export default Logo;
