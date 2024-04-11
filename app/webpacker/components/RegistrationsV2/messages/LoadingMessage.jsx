import React from 'react';
import { Icon, Message } from 'semantic-ui-react';

export default function LoadingMessage() {
  return (
    <Message icon>
      <Icon name="circle notched" loading />
      <Message.Content>
        <Message.Header>Just one second</Message.Header>
        We are fetching that content for you.
      </Message.Content>
    </Message>
  );
}
