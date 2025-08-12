import React from 'react';
import { Card, Header } from 'semantic-ui-react';
import StatusView from './StatusView';
import { ticketTypes } from '../../../lib/wca-data.js.erb';

export default function TicketHeader({ ticketDetails, currentStakeholder, updateStatus }) {
  const { ticket: { id } } = ticketDetails;

  return (
    <Card fluid>
      <Card.Content>
        <Header as="h1">
          {`Ticket #${id}: `}
          <Heading ticketDetails={ticketDetails} />
        </Header>
        <StatusView
          ticketDetails={ticketDetails}
          currentStakeholder={currentStakeholder}
          updateStatus={updateStatus}
        />
      </Card.Content>
    </Card>
  );
}

function Heading({ ticketDetails }) {
  const { ticket: { metadata_type: ticketType, metadata } } = ticketDetails;

  switch (ticketType) {
    case ticketTypes.edit_person:
      return 'Edit Person';
    case ticketTypes.competition_result:
      return metadata.competition.name;
    default:
      return 'Unknown Ticket';
  }
}
