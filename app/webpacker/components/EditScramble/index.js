import React from 'react';
import EditEntry from '../ResultsData/Panel/EditEntry';
import { scrambleUrl } from '../../lib/requests/routes.js.erb';
import ShowSingleScramble from '../ResultsData/Scrambles/ShowSingleScramble';
import ScrambleForm from './ScrambleForm/ScrambleForm';

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
      competitionIdKey="competitionId"
    />
  );
}

export default EditScramble;
