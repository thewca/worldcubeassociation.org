import React from 'react';
import { sanitize } from 'dompurify';
import I18n from '../../lib/i18n';

function TextItem({ item }) {
  return (
    <div
      className="multisearch-item-text"
      /* eslint-disable-next-line react/no-danger */
      dangerouslySetInnerHTML={{
        __html: I18n.t('search_results.index.search_for', { search_string: sanitize(item.search, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }) }),
      }}
    />
  );
}

export default TextItem;
