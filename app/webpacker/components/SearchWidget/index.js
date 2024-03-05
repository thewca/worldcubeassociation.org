import React, { useCallback } from 'react';

import useInputState from '../../lib/hooks/useInputState';
import { SEARCH_MODELS } from '../../lib/wca-data.js.erb';
import { apiV0Urls } from '../../lib/requests/routes.js.erb';
import MultiSearchInput from './MultiSearchInput';

function SearchWidget() {
  // purely a dummy for now...
  const [selectedValue, setSelectedValue] = useInputState([]);
  const urlFn = useCallback((query) => apiV0Urls.search(query, [
    SEARCH_MODELS.competition,
    SEARCH_MODELS.person,
    SEARCH_MODELS.regulation,
    SEARCH_MODELS.incident,
  ]), []);

  return (
    <MultiSearchInput
      selectedValue={selectedValue}
      setSelectedValue={setSelectedValue}
      removeNoResultsMessage
      showOptionToGoToSearchPage
      goToItemUrlOnClick
      url={urlFn}
      multiple={false}
    />
  );
}

export default SearchWidget;
