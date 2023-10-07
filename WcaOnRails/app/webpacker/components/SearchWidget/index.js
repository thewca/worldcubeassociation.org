import React from 'react';

import MultiSearchInput from './MultiSearchInput';
import { omnisearchApiUrl } from '../../lib/requests/routes.js.erb';

function SearchWidget() {
  return (
    <MultiSearchInput
      removeNoResultsMessage
      goToItemOnSelect
      url={omnisearchApiUrl}
    />
  );
}

export default SearchWidget;
