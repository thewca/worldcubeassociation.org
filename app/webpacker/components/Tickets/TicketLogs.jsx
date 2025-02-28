import React from 'react';
import { Header, List } from 'semantic-ui-react';
import { useQuery } from '@tanstack/react-query';
import { ticketLogActionTypes } from '../../lib/wca-data.js.erb';
import getLogs from './api/getLogs';
import Loading from '../Requests/Loading';
import Errored from '../Requests/Errored';

export default function TicketLogs({ ticketId }) {
  const { data: logs, isLoading, isError } = useQuery({
    queryKey: ['ticket-logs', ticketId],
    queryFn: () => getLogs({ ticketId }),
  });

  function logText(actionType, actionValue) {
    switch (actionType) {
      case ticketLogActionTypes.status_updated:
        return `Status updated to ${actionValue}`;
      default:
        return `[Unsupported log]: ${actionType}: ${actionValue}`;
    }
  }

  if (isLoading) return <Loading />;
  if (isError) return <Errored />;

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
