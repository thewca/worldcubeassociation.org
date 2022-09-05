import React from 'react';
import { sanitize } from 'dompurify';

import I18n from '../lib/i18n';

/**
 * @param {string} i18nKey
 * @returns {JSX.Element}
 * @constructor
 */
function I18nHTMLTranslate({
  i18nKey,
}) {
  return (
    <span
      name="I18nHTMLTranslate"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: sanitize(I18n.t(i18nKey)) }}
    />
  );
}

export default I18nHTMLTranslate;
