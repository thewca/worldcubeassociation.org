import React, { useCallback } from 'react';

import { QueryClient, useQueries } from '@tanstack/react-query';
import {
  userSearchApiUrl,
  userAdminSearchApiUrl,
  personSearchApiUrl,
  competitionSearchApiUrl,
  apiV0Urls,
  userApiUrl,
  personApiUrl,
  competitionApiUrl,
  userRoleApiUrl,
} from '../../lib/requests/routes.js.erb';
import MultiSearchInput, { itemToOption } from './MultiSearchInput';
import SEARCH_MODELS from './SearchModel';
import Loading from '../Requests/Loading';
import { fetchJsonOrError } from '../../lib/requests/fetchWithAuthenticityToken';

const WCA_SEARCH_QUERY_CLIENT = new QueryClient();

export function IdWcaSearch({
  name,
  value,
  onChange,
  multiple = true,
  disabled = false,
  model,
  params,
  label,
  removeNoResultsMessage,
}) {
  const idsToFetch = multiple ? value : [value].filter(Boolean);

  const fetchUrlFn = useCallback((id) => {
    switch (model) {
      case SEARCH_MODELS.user:
        return userApiUrl(id);
      case SEARCH_MODELS.person:
        return personApiUrl(id);
      case SEARCH_MODELS.competition:
        return competitionApiUrl(id);
      case SEARCH_MODELS.userRole:
        return userRoleApiUrl(id);
      default:
        throw new Error(`Invalid fetch type in IdWcaSearch component: ${model}`);
    }
  }, [model]);

  const convertModelFn = useCallback((apiData) => {
    switch (model) {
      case SEARCH_MODELS.user:
        return apiData.user;
      case SEARCH_MODELS.person:
        return apiData.person;
      case SEARCH_MODELS.competition:
      case SEARCH_MODELS.userRole:
        return apiData;
      default:
        throw new Error(`Invalid conversion type in IdWcaSearch component: ${model}`);
    }
  }, [model]);

  const { data: fetchedOptions, isPending: anyLoading } = useQueries({
    queries: idsToFetch.map((id) => (
      {
        queryKey: [model, id],
        queryFn: () => fetchJsonOrError(fetchUrlFn(id)),
        select: (result) => itemToOption(convertModelFn(result.data)),
      }
    )),
    combine: (results) => ({
      data: results.map((result) => result.data),
      isPending: results.some((result) => result.isPending),
    }),
  }, WCA_SEARCH_QUERY_CLIENT);

  const filteredOptions = fetchedOptions.filter(Boolean);
  const valueOptions = multiple ? filteredOptions : filteredOptions[0];

  const onChangeIdOnly = useCallback((evt, data) => {
    const { value: apiValues } = data;

    const extractedIds = multiple ? apiValues.map((apiValue) => apiValue.id) : apiValues?.id;
    const changePayload = { ...data, value: extractedIds };

    onChange(evt, changePayload);
  }, [onChange, multiple]);

  if (anyLoading) return <Loading />;

  return (
    <WcaSearch
      name={name}
      value={valueOptions}
      onChange={onChangeIdOnly}
      multiple={multiple}
      disabled={disabled}
      model={model}
      params={params}
      label={label}
      removeNoResultsMessage={removeNoResultsMessage}
    />
  );
}

export default function WcaSearch({
  name,
  value,
  onChange,
  multiple = true,
  disabled = false,
  model,
  params = {},
  label,
  removeNoResultsMessage,
}) {
  const urlFn = useCallback((query) => {
    switch (model) {
      case SEARCH_MODELS.user:
        return (params.adminSearch
          ? `${userAdminSearchApiUrl(query)}&${new URLSearchParams(params).toString()}`
          : `${userSearchApiUrl(query)}&${new URLSearchParams(params).toString()}`);
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
      removeNoResultsMessage={removeNoResultsMessage}
    />
  );
}
