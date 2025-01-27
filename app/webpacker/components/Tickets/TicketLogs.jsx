import React from 'react';
import { Header, List } from 'semantic-ui-react';
import { ticketLogActionTypes } from '../../lib/wca-data.js.erb';

export default function TicketLogs({ logs }) {
  function logText(actionType, actionValue) {
    switch (actionType) {
      case ticketLogActionTypes.status_updated:
        return `Status updated to ${actionValue}`;
      default:
        return `[Unsupported log]: ${actionType}: ${actionValue}`;
    }
  }

  return (
    <>
      <Header as="h2">Logs</Header>
      <List>
        {logs.map(({
          action_type: actionType,
          action_value: actionValue,
          created_at: createdAt,
        }) => (
          <List.Item>
            {createdAt}
            {': '}
            {logText(actionType, actionValue)}
          </List.Item>
        ))}
      </List>
    </>
  );
}
