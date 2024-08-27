import React from 'react';
import CreateEntry from '../ResultsData/Panel/CreateEntry';
import { InlineEditForm } from './index';

function NewResult({
  result,
}) {
  return (
    <CreateEntry
      initDataItem={result}
      EditForm={InlineEditForm}
    />
  );
}

export default NewResult;
