import React, { useEffect } from 'react';
import { FormField, FormGroup, Radio } from 'semantic-ui-react';
import { IdWcaSearch } from '../../../SearchWidget/WcaSearch';
import SEARCH_MODELS from '../../../SearchWidget/SearchModel';
import useInputState from '../../../../lib/hooks/useInputState';
import AnonymizationTicketWorkbenchForWrt from '../../../Tickets/TicketWorkbenches/AnonymizationTicketWorkbenchForWrt';

const MODEL_NAME = {
  [SEARCH_MODELS.user]: 'User',
  [SEARCH_MODELS.person]: 'Person',
};

export default function AnonymizationScriptPage() {
  const [model, setModel] = useInputState(SEARCH_MODELS.user);
  const [searchInput, setSearchInput] = useInputState();

  useEffect(() => setSearchInput(null), [model, setSearchInput]);

  return (
    <>
      <FormGroup grouped>
        <div>Select where to search for</div>
        {[SEARCH_MODELS.user, SEARCH_MODELS.person].map((searchModel, index) => (
          <FormField key={searchModel}>
            <Radio
              label={MODEL_NAME[index]}
              value={searchModel}
              checked={model === searchModel}
              onChange={setModel}
            />
          </FormField>
        ))}
      </FormGroup>
      <IdWcaSearch
        label={`Search ${MODEL_NAME[model]}`}
        model={model}
        multiple={false}
        value={searchInput}
        onChange={setSearchInput}
      />
      {model === SEARCH_MODELS.user && (
        <AnonymizationTicketWorkbenchForWrt
          userId={searchInput}
        />
      )}
      {model === SEARCH_MODELS.person && (
        <AnonymizationTicketWorkbenchForWrt
          wcaId={searchInput}
        />
      )}
    </>
  );
}
