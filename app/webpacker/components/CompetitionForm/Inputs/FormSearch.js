import React, { useCallback, useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import {
  userApiUrl,
  competitionApiUrl,
} from '../../../lib/requests/routes.js.erb';
import Loading from '../../Requests/Loading';
import { itemToOption } from '../../SearchWidget/MultiSearchInput';
import WcaSearch from '../../SearchWidget/WcaSearch';
import SEARCH_MODELS from '../../SearchWidget/SearchModel';
import { fetchJsonOrError } from '../../../lib/requests/fetchWithAuthenticityToken';

const useWrapIdOnly = (originalCallback) => useCallback((evt, data) => {
  const { value: values } = data;

  const extractedIds = values.map((value) => value.id);
  const changePayload = { ...data, value: extractedIds };

  originalCallback(evt, changePayload);
}, [originalCallback]);

export function UserSearch({
  value,
  onChange,
  delegateOnly = false,
  traineeOnly = false,
}) {
  const userIds = useMemo(() => (value || []), [value]);

  const { data: userOptions, isPending: anyLoading } = useQueries({
    queries: userIds.map((id) => (
      {
        queryKey: ['user', id],
        queryFn: () => fetchJsonOrError(userApiUrl(id)),
        // the users API actually returns users in the format { "user": interesting_stuff }
        select: (result) => itemToOption(result.data.user),
      }
    )),
    combine: (results) => ({
      data: results.map((result) => result.data),
      isPending: results.some((result) => result.isPending),
    }),
  });

  const onChangeIdOnly = useWrapIdOnly(onChange);

  if (anyLoading) return <Loading />;

  return (
    <WcaSearch
      value={userOptions}
      onChange={onChangeIdOnly}
      model={SEARCH_MODELS.user}
      params={{ only_staff_delegates: delegateOnly, only_trainee_delegates: traineeOnly }}
    />
  );
}

export function CompetitionSearch({
  value,
  onChange,
  disabled,
}) {
  const competitionIds = useMemo(() => (value || []), [value]);

  const { data: compOptions, isPending: anyLoading } = useQueries({
    queries: competitionIds.map((id) => (
      {
        queryKey: ['competition', id],
        queryFn: () => fetchJsonOrError(competitionApiUrl(id)),
        select: (result) => itemToOption(result.data),
      }
    )),
    combine: (results) => ({
      data: results.map((result) => result.data),
      isPending: results.some((result) => result.isPending),
    }),
  });

  const onChangeIdOnly = useWrapIdOnly(onChange);

  if (anyLoading) return <Loading />;

  return (
    <WcaSearch
      value={compOptions}
      onChange={onChangeIdOnly}
      model={SEARCH_MODELS.competition}
      disabled={disabled}
    />
  );
}
