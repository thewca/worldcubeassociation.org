import React from 'react';

import OmnisearchInput from './OmnisearchInput';
import { omnisearchApiUrl } from '../../lib/requests/routes.js.erb';

const SearchWidget = () => (
  <OmnisearchInput
    removeNoResultsMessage
    goToItemOnSelect
    url={omnisearchApiUrl}
  />
);

export default SearchWidget;
