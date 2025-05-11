import React from 'react';
import { Card, Header } from 'semantic-ui-react';
import StatusView from './StatusView';

export default function TicketHeader({ ticketDetails, currentStakeholder, sync }) {
  const { ticket: { id } } = ticketDetails;

  return (
    <Card fluid>
      <Card.Content>
        <Header as="h1">{`Ticket #${id}`}</Header>
        <StatusView
          ticketDetails={ticketDetails}
          currentStakeholder={currentStakeholder}
          sync={sync}
        />
      </Card.Content>
    </Card>
  );
}
