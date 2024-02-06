import React, { useCallback } from 'react';

import {
  userSearchApiUrl,
  personSearchApiUrl,
  competitionSearchApiUrl,
} from '../../lib/requests/routes.js.erb';
import MultiSearchInput from './MultiSearchInput';

export default function WcaSearch({
  name,
  value,
  onChange,
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
    />
  );
}
