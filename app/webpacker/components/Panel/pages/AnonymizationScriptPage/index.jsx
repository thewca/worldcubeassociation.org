import React from 'react';
import { FormField, FormGroup, Radio } from 'semantic-ui-react';
import AdminWcaSearch from '../../../SearchWidget/AdminWcaSearch';
import SEARCH_MODELS from '../../../SearchWidget/SearchModel';
import useInputState from '../../../../lib/hooks/useInputState';
import AnonymizationTicketWorkbenchForWrt from '../../../Tickets/TicketWorkbenches/AnonymizationTicketWorkbenchForWrt';

const AVAILABLE_MODELS = [
  {
    id: SEARCH_MODELS.user,
    name: 'User',
  },
  {
    id: SEARCH_MODELS.person,
    name: 'Person',
  },
];

export default function AnonymizationScriptPage() {
  const [activeModelIndex, setActiveModelIndex] = useInputState(0);
  const [searchInput, setSearchInput] = useInputState();
  const activeModel = AVAILABLE_MODELS[activeModelIndex];

  const modelSelectHandler = (_, { value: selectedModelIndex }) => {
    setActiveModelIndex(selectedModelIndex);
    setSearchInput(null);
  };

  return (
    <>
      <FormGroup grouped>
        <div>Select where to search for</div>
        {AVAILABLE_MODELS.map((model, index) => (
          <FormField key={model.id}>
            <Radio
              label={model.name}
              value={index}
              checked={activeModelIndex === index}
              onChange={modelSelectHandler}
            />
          </FormField>
        ))}
      </FormGroup>
      <AdminWcaSearch
        label={`Search ${activeModel.name}`}
        model={activeModel.id}
        multiple={false}
        value={searchInput}
        onChange={setSearchInput}
      />
      <AnonymizationTicketWorkbenchForWrt
        userId={activeModel.id === SEARCH_MODELS.user ? searchInput : null}
        wcaId={activeModel.id === SEARCH_MODELS.person ? searchInput : null}
      />
    </>
  );
}
