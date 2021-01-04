import React from 'react';
import I18n from '../i18n';

const TextItem = ({ item }) => (
  <div
    className="omnisearch-item-text"
    /* eslint-disable-next-line react/no-danger */
    dangerouslySetInnerHTML={{
      __html: I18n.t('search_results.index.search_for', { search_string: item.search }),
    }}
  />
);

export default TextItem;
