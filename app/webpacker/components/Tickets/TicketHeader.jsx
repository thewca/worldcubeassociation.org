import React from 'react';
import { Header } from 'semantic-ui-react';

export default function TicketHeader({ ticketDetails }) {
  const { ticket: { id, metadata } } = ticketDetails;

  return (
    <>
      <Header as="h1">{`Ticket #${id}`}</Header>
      <p>{`Status: ${metadata.status}`}</p>
    </>
  );
}
