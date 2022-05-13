import React from 'react';

import { registerComponent } from '../lib/utils/react';
import OmnisearchInput from './SearchWidget/OmnisearchInput';
import { omnisearchApiUrl } from '../lib/requests/routes.js.erb';

const SearchWidget = () => (
  <OmnisearchInput
    removeNoResultsMessage
    goToItemOnSelect
    url={omnisearchApiUrl}
  />
);

registerComponent(SearchWidget, 'SearchWidget');
