import React, { useCallback } from 'react';

import {
  userSearchApiUrl,
  personSearchApiUrl,
  competitionSearchApiUrl,
} from '../../lib/requests/routes.js.erb';
import MultiSearchInput from './MultiSearchInput';

export default function WcaSearch({
  selectedValue,
  setSelectedValue,
  multiple = true,
  disabled = false,
  model,
  params,
}) {
  const urlFn = useCallback((query) => {
    if (model === 'user') {
      return `${userSearchApiUrl(query)}&${new URLSearchParams(params).toString()}`;
    }

    if (model === 'person') {
      return `${personSearchApiUrl(query)}&${new URLSearchParams(params).toString()}`;
    }

    if (model === 'competition') {
      return `${competitionSearchApiUrl(query)}&${new URLSearchParams(params).toString()}`;
    }

    throw new Error(`Invalid search type in WcaSearch component: ${model}`);
  }, [params, model]);

  return (
    <MultiSearchInput
      url={urlFn}
      selectedValue={multiple ? selectedValue || [] : selectedValue}
      setSelectedValue={setSelectedValue}
      multiple={multiple}
      disabled={disabled}
    />
  );
}
