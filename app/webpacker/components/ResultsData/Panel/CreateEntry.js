import React from 'react';

function CreateEntry({
  initDataItem,
  EditForm,
}) {
  return (
    <>
      <h3>Creating a new result</h3>
      <EditForm dataItem={initDataItem} sync={() => {}} />
    </>
  );
}

export default CreateEntry;
