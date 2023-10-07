import React, { useCallback, useMemo } from 'react';
import {
  userSearchApiUrl,
  userApiUrl,
  competitionSearchApiUrl,
  competitionApiUrl,
} from '../../../lib/requests/routes.js.erb';
import Loading from '../../Requests/Loading';
import MultiSearchInput from '../../SearchWidget/MultiSearchInput';
import { useManyLoadedData } from '../../../lib/hooks/useLoadedData';

export function UserSearch({
  value,
  onChange,
  delegateOnly = false,
  traineeOnly = false,
}) {
  const userIds = useMemo(() => (value || []), [value]);

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();

    if (delegateOnly) params.append('only_staff_delegates', true);
    if (traineeOnly) params.append('only_trainee_delegates', true);

    return params;
  }, [delegateOnly, traineeOnly]);

  const userSearchApiUrlFn = useCallback((query) => `${userSearchApiUrl(query)}&${queryParams.toString()}`, [queryParams]);

  const {
    data,
    anyLoading,
  } = useManyLoadedData(userIds, userApiUrl);

  const preSelected = useMemo(
    // the users API actually returns users in the format { "user": stuff_you_are_interested_in }
    () => Object.values(data).map((item) => item.user),
    [data],
  );

  if (anyLoading) return <Loading />;

  return (
    <MultiSearchInput
      url={userSearchApiUrlFn}
      goToItemOnSelect={false}
      preSelected={preSelected}
      onSearchChange={onChange}
    />
  );
}

export function CompetitionSearch({
  value,
  onChange,
  freeze,
}) {
  const competitionIds = useMemo(() => (value?.split(',').filter(Boolean) || []), [value]);

  const {
    data: initialData,
    anyLoading,
  } = useManyLoadedData(competitionIds, competitionApiUrl);

  const preSelected = useMemo(() => Object.values(initialData), [initialData]);

  if (anyLoading) return <Loading />;

  return (
    <MultiSearchInput
      url={competitionSearchApiUrl}
      goToItemOnSelect={false}
      preSelected={preSelected}
      disabled={freeze}
      onSearchChange={onChange}
    />
  );
}
