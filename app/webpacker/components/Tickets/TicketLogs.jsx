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

  function logText(actionType, metadataAction) {
    switch (actionType) {
      case ticketLogActionTypes.create_ticket:
        return 'Ticket created.';
      case ticketLogActionTypes.update_status:
        return 'Status updated.';
      case ticketLogActionTypes.create_comment:
        return 'Comment added.';
      case ticketLogActionTypes.metadata_action:
        return `Action ${metadataAction} performed.`;
      default:
        return `[Unsupported log]: ${actionType}.`;
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
          metadata_action: metadataAction,
          created_at: createdAt,
        }) => (
          <List.Item>
            {createdAt}
            {': '}
            {logText(actionType, metadataAction)}
          </List.Item>
        ))}
      </List>
    </>
  );
}
