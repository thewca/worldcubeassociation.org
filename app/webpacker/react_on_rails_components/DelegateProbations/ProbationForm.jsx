import React from 'react';
import { Button } from 'semantic-ui-react';
import WcaSearch from '../SearchWidget/WcaSearch';
import useInputState from '../../lib/hooks/useInputState';
import { apiV0Urls } from '../../lib/requests/routes.js.erb';
import { groupTypes } from '../../lib/wca-data.js.erb';
import SEARCH_MODELS from '../SearchWidget/SearchModel';

export default function ProbationForm({ save, sync }) {
  const [role, setRole] = useInputState();

  return (
    <>
      <WcaSearch
        name="user"
        value={role}
        onChange={setRole}
        multiple={false}
        model={SEARCH_MODELS.userRole}
        params={{ groupType: groupTypes.delegate_regions }}
      />
      <Button
        onClick={() => save(apiV0Urls.userRoles.create(), {
          userId: role.item.user.id,
          groupType: groupTypes.delegate_probation,
        }, () => {
          sync();
          setRole(null);
        }, { method: 'POST' })}
        disabled={!role}
      >
        Start Probation
      </Button>
    </>
  );
}
