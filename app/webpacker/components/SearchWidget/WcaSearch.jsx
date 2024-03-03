import React, { useCallback } from 'react';

import { apiV0Urls } from '../../lib/requests/routes.js.erb';
import MultiSearchInput from './MultiSearchInput';

export default function WcaSearch({
  name,
  value,
  onChange,
  multiple = true,
  disabled = false,
  models,
  params,
  removeNoResultsMessage,
  showOptionToGoToSearchPage = false,
  goToItemUrlOnClick = false,
}) {
  const urlFn = useCallback((query) => apiV0Urls.search(query, models, params), [models, params]);

  const onChangeInternal = useCallback((evt, data) => {
    onChange(evt, { ...data, name });
  }, [onChange, name]);

  return (
    <MultiSearchInput
      url={urlFn}
      selectedValue={multiple ? value || [] : value}
      onChange={onChangeInternal}
      multiple={multiple}
      disabled={disabled}
      removeNoResultsMessage={removeNoResultsMessage}
      showOptionToGoToSearchPage={showOptionToGoToSearchPage}
      goToItemUrlOnClick={goToItemUrlOnClick}
    />
  );
}
