import React, { useState } from 'react';

import { omnisearchApiUrl } from '../../lib/requests/routes.js.erb';
import MultiSearchInput from './MultiSearchInput';

function SearchWidget() {
  // purely a dummy for now...
  const [selectedValue, setSelectedValue] = useState([]);

  return (
    <MultiSearchInput
      selectedValue={selectedValue}
      setSelectedValue={setSelectedValue}
      removeNoResultsMessage
      showOptionToGoToSearchPage
      goToItemUrlOnClick
      url={omnisearchApiUrl}
      multiple={false}
    />
  );
}

export default SearchWidget;
