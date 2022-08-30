import React from 'react';
import I18n from '../../lib/i18n';

/**
 * @returns {JSX.Element}
 * @constructor
 */
function Logo({ title }) {
  return (
    <>
      <h1>{title}</h1>
      {I18n.t('logo.paragraphs').map((paragraph, index) => paragraph && (
        <p
          // eslint-disable-next-line react/no-array-index-key
          key={`logo-paragraphs-${index}`}
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: paragraph }}
        />
      ))}
    </>
  );
}

export default Logo;
