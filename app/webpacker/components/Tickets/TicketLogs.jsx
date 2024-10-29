import React from 'react';
import { Header, List } from 'semantic-ui-react';

export default function TicketLogs({ logs }) {
  return (
    <>
      <Header as="h2">Logs</Header>
      <List>
        {logs.map(({ log, created_at: createdAt }) => (
          <List.Item>
            {createdAt}
            {': '}
            {log}
          </List.Item>
        ))}
      </List>
    </>
  );
}
