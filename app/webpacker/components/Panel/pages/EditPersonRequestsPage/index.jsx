import React from 'react';
import { Header } from 'semantic-ui-react';
import TicketsList from '../../../TicketsList';
import { ticketTypes, ticketStatuses } from '../../../../lib/wca-data.js.erb';

export default function EditPersonRequestsPage() {
  return (
    <>
      <Header>Open Tickets</Header>
      <TicketsList
        type={ticketTypes.edit_person}
        status={ticketStatuses.edit_person.open}
        sort="createdAt:desc"
      />
      <Header>Closed Tickets</Header>
      <TicketsList
        type={ticketTypes.edit_person}
        status={ticketStatuses.edit_person.closed}
        sort="createdAt:desc"
      />
    </>
  );
}
