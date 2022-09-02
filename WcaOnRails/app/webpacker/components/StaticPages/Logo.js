import React from 'react';
import I18n from '../../lib/i18n';
import I18nHTMLTranslate from '../I18nHTMLTranslate';
import '../../stylesheets/static_pages/logo.scss';

/**
 * @returns {JSX.Element}
 * @constructor
 */
function Logo({ title }) {
  console.log(Object.keys(I18n.t('logo.paragraphs')));
  return (
    <div className="wca-logo-information">
      <h1>{title}</h1>
      {Object.keys(I18n.t('logo.paragraphs')).map((index) => (
        <p key={`logo-paragraphs-${index.toString()}`}>
          <I18nHTMLTranslate
            i18nKey={`logo.paragraphs.${index}`}
          />
        </p>
      ))}
    </div>
  );
}

export default Logo;
