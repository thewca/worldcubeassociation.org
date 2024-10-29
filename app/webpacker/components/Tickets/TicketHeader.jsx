import React from 'react';
import { Header } from 'semantic-ui-react';

export default function TicketHeader({ ticketDetails }) {
  const { ticket: { id, metadata, name } } = ticketDetails;

  return (
    <>
      <Header as="h1">{`Ticket #${id}: ${name}`}</Header>
      <p>{`Status: ${metadata.status}`}</p>
    </>
  );
}
