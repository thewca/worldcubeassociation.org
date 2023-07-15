import React, { useCallback, useEffect, useState } from 'react';
import { userApiUrl } from '../../../lib/requests/routes.js.erb';
import { fetchJsonOrError } from '../../../lib/requests/fetchWithAuthenticityToken';
import Loading from '../../Requests/Loading';

export function UserSearch({
  value,
  onChange,
  delegateOnly = false,
  traineeOnly = false,
}) {
  let classNames = 'form-control user_ids optional wca-autocomplete wca-autocomplete-users_search';
  if (delegateOnly) classNames += ' wca-autocomplete-only_staff_delegates';
  if (traineeOnly) classNames += ' wca-autocomplete-only_trainee_delegates';

  const [initialData, setInitialData] = useState(value ? null : '[]');

  useEffect(() => {
    if (!value) return;

    const ids = value.split(',');
    const promises = ids.map((id) => fetchJsonOrError(userApiUrl(id)));

    Promise.all(promises).then((reqs) => {
      const users = reqs.map((req) => req.data.user);
      setInitialData(JSON.stringify(users));
    });
  }, []);

  // This is a workaround for selectize and jquery not calling onChange
  const refWrapper = useCallback((ref) => {
    $(ref).on('change', (e) => onChange(e, { value: e.target.value })).wcaAutocomplete();
  }, []);

  if (!initialData) return <Loading />;

  return (
    <input
      ref={refWrapper}
      defaultValue={value}
      className={classNames}
      type="text"
      data-data={initialData}
    />
  );
}

export function CompetitionSearch() {
}
