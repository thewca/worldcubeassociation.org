import React from 'react';
import EditEntry from '../ResultsData/Panel/EditEntry';
import { resultUrl } from '../../lib/requests/routes.js.erb';
import ShowSingleResult from '../ResultsData/Results/ShowSingleResult';
import ResultForm from './ResultForm/ResultForm';

export function InlineEditForm({
  dataItem,
  sync,
}) {
  return (
    <ResultForm result={dataItem} sync={sync} />
  );
}

function EditResult({
  id,
}) {
  return (
    <EditEntry
      id={id}
      dataUrlFn={resultUrl}
      DisplayTable={ShowSingleResult}
      EditForm={InlineEditForm}
    />
  );
}

export default EditResult;
