import React from 'react';
import WcaSearch from '../../../SearchWidget/WcaSearch';
import SEARCH_MODELS from '../../../SearchWidget/SearchModel';
import useInputState from '../../../../lib/hooks/useInputState';
import AnonymizationTicketWorkbench from '../../../Tickets/TicketWorkbenches/AnonymizationTicketWorkbench';

export default function AnonymizationScriptPage() {
  const [user, setUser] = useInputState();

  return user
    ? (
      <AnonymizationTicketWorkbench
        userId={user?.id}
        wcaId={user?.item?.wca_id}
      />
    )
    : (
      <WcaSearch
        label="Enter the user to anonymize"
        model={SEARCH_MODELS.user}
        multiple={false}
        value={user}
        onChange={setUser}
      />
    );
}
