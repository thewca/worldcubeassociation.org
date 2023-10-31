import React, { useCallback, useMemo } from 'react';
import { userSearchApiUrl, userApiUrl } from '../../lib/requests/routes.js.erb';
import Loading from '../Requests/Loading';
import MultiSearchInput, { itemToOption } from './MultiSearchInput';
import { useManyLoadedData } from '../../lib/hooks/useLoadedData';

export default function UserSearch({
  value,
  onChange,
  delegateOnly = false,
  traineeOnly = false,
  multiple = true,
}) {
  const userIds = useMemo(() => {
    if (multiple) return value || [];
    return value ? [value] : [];
  }, [value, multiple]);

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
    () => Object.values(data).map((item) => itemToOption(item.user)),
    [data],
  );

  if (anyLoading) return <Loading />;

  return (
    <MultiSearchInput
      url={userSearchApiUrlFn}
      goToItemOnSelect={false}
      selectedItems={preSelected}
      onChange={onChange}
      multiple={multiple}
    />
  );
}
