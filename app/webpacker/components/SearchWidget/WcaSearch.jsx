import React, { useCallback } from 'react';

import { apiV0Urls } from '../../lib/requests/routes.js.erb';
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
  const urlFn = useCallback((query) => apiV0Urls.search(query, [model], params), [model, params]);

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
