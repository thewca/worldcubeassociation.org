import React from 'react';

import { Message } from 'semantic-ui-react';

function SaveMessage({ response }) {
  return (
    <>
      {response.messages && (
      <Message
        positive
        header="Save was successful!"
        list={response.messages}
      />
      )}
      {response.errors && (
      <Message
        error
        list={response.errors}
        header="Something went wrong when saving the result."
      />
      )}
    </>
  );
}

export default SaveMessage;
