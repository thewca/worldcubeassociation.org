import React from 'react';
import CreateEntry from '../ResultsData/Panel/CreateEntry';
import { InlineEditForm } from './index';

function NewScramble({
  scramble,
}) {
  return (
    <CreateEntry
      initDataItem={scramble}
      dataType="scramble"
      EditForm={InlineEditForm}
    />
  );
}

export default NewScramble;
