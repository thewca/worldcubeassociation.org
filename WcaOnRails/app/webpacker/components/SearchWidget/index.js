import React from 'react';

import { omnisearchApiUrl } from '../../lib/requests/routes.js.erb';
import MultiSearchInput from './MultiSearchInput';
import useInputState from '../../lib/hooks/useInputState';

function SearchWidget() {
  // purely a dummy for now...
  const [selectedValue, setSelectedValue] = useInputState([]);

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
