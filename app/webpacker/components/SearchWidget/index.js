import React from 'react';

import useInputState from '../../lib/hooks/useInputState';
import WcaSearch from './WcaSearch';
import { SEARCH_MODELS } from '../../lib/wca-data.js.erb';

function SearchWidget() {
  // purely a dummy for now...
  const [selectedValue, setSelectedValue] = useInputState([]);

  return (
    <WcaSearch
      value={selectedValue}
      onChange={(_, { value }) => setSelectedValue(value)}
      multiple={false}
      removeNoResultsMessage
      showOptionToGoToSearchPage
      goToItemUrlOnClick
      models={[
        SEARCH_MODELS.competition,
        SEARCH_MODELS.person,
        SEARCH_MODELS.regulation,
        SEARCH_MODELS.incident,
      ]}
    />
  );
}

export default SearchWidget;
