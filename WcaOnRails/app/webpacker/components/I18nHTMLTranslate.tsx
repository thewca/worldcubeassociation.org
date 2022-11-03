import React from 'react';
import { sanitize } from 'dompurify';

import I18n from '../lib/i18n';

function I18nHTMLTranslate({
  i18nKey, options,
}: {
  i18nKey: string; options?: any;
}): JSX.Element {
  return (
    <span
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: sanitize(I18n.t(i18nKey, options)) }}
    />
  );
}

I18nHTMLTranslate.defaultProps = {
  options: {},
};

export default I18nHTMLTranslate;
