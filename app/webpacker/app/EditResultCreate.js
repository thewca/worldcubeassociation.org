import React from 'react';
import CreateEntry from '../components/ResultsData/Panel/CreateEntry';
import { InlineEditForm } from './EditResult';

function NewResult({
  result,
}) {
  return (
    <CreateEntry
      initDataItem={result}
      dataType="result"
      EditForm={InlineEditForm}
    />
  );
}

export default NewResult;
