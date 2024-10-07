import React from 'react';
import EditEntry from '../ResultsData/Panel/EditEntry';
import { scrambleUrl } from '../../lib/requests/routes.js.erb';
import ShowSingleScramble from '../ResultsData/Results/ShowSingleResult';

export function InlineEditForm({
  dataItem,
  sync,
}) {
  return (
    <ScrambleForm scramble={dataItem} sync={sync} />
  );
}

function EditResult({
  id,
}) {
  return (
    <EditEntry
      id={id}
      dataUrlFn={scrambleUrl}
      DisplayTable={ShowSingleScramble}
      EditForm={InlineEditForm}
    />
  );
}

export default EditResult;
