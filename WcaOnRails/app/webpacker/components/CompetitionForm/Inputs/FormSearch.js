import React, { useCallback, useMemo } from 'react';
import {
  userApiUrl,
  competitionApiUrl,
} from '../../../lib/requests/routes.js.erb';
import Loading from '../../Requests/Loading';
import { itemToOption } from '../../SearchWidget/MultiSearchInput';
import { useManyLoadedData } from '../../../lib/hooks/useLoadedData';
import WcaSearch from '../../SearchWidget/WcaSearch';

const useWrapIdOnly = (originalCallback) => useCallback((values) => {
  const extractedIds = values.map((value) => value.id);
  // FIXME this is supposed to be an event that triggered the change.
  // We lost this during the most recent refactor, but I'm not sure whether that's even a problem.
  originalCallback(null, { value: extractedIds });
}, [originalCallback]);

export function UserSearch({
  value,
  onChange,
  delegateOnly = false,
  traineeOnly = false,
}) {
  const userIds = useMemo(() => (value || []), [value]);

  const {
    data: initialData,
    anyLoading,
  } = useManyLoadedData(userIds, userApiUrl);

  const preSelected = useMemo(
    // the users API actually returns users in the format { "user": stuff_you_are_interested_in }
    () => Object.values(initialData).map((item) => itemToOption(item.user)),
    [initialData],
  );

  const setSelectedValue = useWrapIdOnly(onChange);

  if (anyLoading) return <Loading />;

  return (
    <WcaSearch
      selectedValue={preSelected}
      setSelectedValue={setSelectedValue}
      model="user"
      params={{ only_staff_delegates: delegateOnly, only_trainee_delegates: traineeOnly }}
    />
  );
}

export function CompetitionSearch({
  value,
  onChange,
  disabled,
}) {
  const competitionIds = useMemo(() => (value?.split(',').filter(Boolean) || []), [value]);

  const {
    data: initialData,
    anyLoading,
  } = useManyLoadedData(competitionIds, competitionApiUrl);

  const preSelected = useMemo(
    () => Object.values(initialData).map(itemToOption),
    [initialData],
  );

  const setSelectedValue = useWrapIdOnly(onChange);

  if (anyLoading) return <Loading />;

  return (
    <WcaSearch
      selectedValue={preSelected}
      setSelectedValue={setSelectedValue}
      disabled={disabled}
    />
  );
}
