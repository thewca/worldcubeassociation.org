import React from 'react';
import _ from 'lodash';

function CreateEntry({
  initDataItem,
  dataType,
  EditForm,
}) {
  return (
    <>
      <h3>
        Creating a new
        {' '}
        {_.upperFirst(dataType)}
      </h3>
      <EditForm dataItem={initDataItem} sync={() => {}} />
    </>
  );
}

export default CreateEntry;
