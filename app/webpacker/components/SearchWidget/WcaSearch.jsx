import React, { useCallback } from 'react';

import {
  userSearchApiUrl,
  personSearchApiUrl,
  competitionSearchApiUrl,
  apiV0Urls,
} from '../../lib/requests/routes.js.erb';
import MultiSearchInput from './MultiSearchInput';
import SEARCH_MODELS from './SearchModel';

export default function WcaSearch({
  name,
  value,
  onChange,
  multiple = true,
  disabled = false,
  model,
  params,
  label,
}) {
  const urlFn = useCallback((query) => {
    switch (model) {
      case SEARCH_MODELS.user:
        return `${userSearchApiUrl(query)}&${new URLSearchParams(params).toString()}`;
      case SEARCH_MODELS.person:
        return `${personSearchApiUrl(query)}&${new URLSearchParams(params).toString()}`;
      case SEARCH_MODELS.competition:
        return `${competitionSearchApiUrl(query)}&${new URLSearchParams(params).toString()}`;
      case SEARCH_MODELS.userRole:
        return apiV0Urls.userRoles.search(query, params.groupType);
      default:
        throw new Error(`Invalid search type in WcaSearch component: ${model}`);
    }
  }, [model, params]);

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
      placeholder={label}
    />
  );
}
