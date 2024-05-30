import React from 'react';

import { Message, Icon } from 'semantic-ui-react';

function Errored({
  componentName, error,
}) {
  return (
    <Message icon negative>
      <Icon name="warning sign" />
      <Message.Content>
        <Message.Header>Oh no :(</Message.Header>
        <>
          Something went wrong while loading the data
          {componentName && (
            <>
              {' '}
              for the component &apos;
              {componentName}
              &apos;
            </>
          )}
          {'\n'}
          {String(error) || ''}
        </>
        !
      </Message.Content>
    </Message>
  );
}

export default Errored;
