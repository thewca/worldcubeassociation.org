import React from 'react';
import { sanitize } from 'dompurify';

import I18n from '../lib/i18n';

function I18nHTMLTranslate({
  i18nKey,
}) {
  return (
    <div name="I18nHTMLTranslate" dangerouslySetInnerHTML={{ __html: sanitize(I18n.t(i18nKey)) }} />
  );
}

export default I18nHTMLTranslate;
