import React from 'react';
import EditEntry from '../components/ResultsData/Panel/EditEntry';
import { scrambleUrl } from '../lib/requests/routes.js.erb';
import ShowSingleScramble from '../components/ResultsData/Scrambles/ShowSingleScramble';
import ScrambleForm from '../components/EditScramble/ScrambleForm/ScrambleForm';

export function InlineEditForm({
  dataItem,
  sync,
}) {
  return (
    <ScrambleForm scramble={dataItem} sync={sync} />
  );
}

function EditScramble({
  id,
}) {
  return (
    <EditEntry
      id={id}
      dataUrlFn={scrambleUrl}
      dataType="scramble"
      DisplayTable={ShowSingleScramble}
      EditForm={InlineEditForm}
    />
  );
}

export default EditScramble;
