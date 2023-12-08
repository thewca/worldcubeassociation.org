import React, {
  useCallback,
} from 'react';

import { userSearchApiUrl, personSearchApiUrl } from '../../lib/requests/routes.js.erb';
import MultiSearchInput from './MultiSearchInput';

export default function WcaSearch({
  name,
  value,
  onChange,
  multiple = true,
  model,
  params,
}) {
  const urlFn = useCallback((query) => {
    if (model === 'user') {
      return `${userSearchApiUrl(query)}&${new URLSearchParams(params).toString()}`;
    } if (model === 'person') {
      return `${personSearchApiUrl(query)}&${new URLSearchParams(params).toString()}`;
    }
    return '';
  }, [params, model]);

  const setValue = (setValueFn) => {
    const newValue = setValueFn();
    onChange(null, { name, value: newValue });
  };

  return (
    <MultiSearchInput
      url={urlFn}
      selectedValue={multiple ? value || [] : value}
      setSelectedValue={setValue}
      multiple={multiple}
    />
  );
}
