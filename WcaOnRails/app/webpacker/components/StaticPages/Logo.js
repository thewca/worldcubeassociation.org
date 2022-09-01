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
      {I18n.t('logo.paragraphs').map((_, index) => (
        <p>
          <I18nHTMLTranslate
            // eslint-disable-next-line react/no-array-index-key
            key={`logo-paragraphs-${index}`}
            i18nKey={`logo.paragraphs.${index}`}
          />
        </p>
      ))}
    </div>
  );
}

export default Logo;
