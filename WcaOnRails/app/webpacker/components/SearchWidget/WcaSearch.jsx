import React, {
  useCallback,
} from 'react';

import { userSearchApiUrl, personSearchApiUrl } from '../../lib/requests/routes.js.erb';
import MultiSearchInput from './MultiSearchInput';

export default function WcaSearch({
  selectedValue,
  setSelectedValue,
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

  return (
    <MultiSearchInput
      url={urlFn}
      selectedValue={multiple ? selectedValue || [] : selectedValue}
      setSelectedValue={setSelectedValue}
      multiple={multiple}
    />
  );
}
