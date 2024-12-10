import React from 'react';
import { List, Message } from 'semantic-ui-react';

export default function RegistrationNotAllowedMessage({ reasons }) {
  return (
    <Message negative>
      <List>
        {reasons.map((reason) => (
          <List.Item key={reason}>{reason}</List.Item>
        ))}
      </List>
    </Message>
  );
}
