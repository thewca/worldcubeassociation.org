import React from 'react';
import { ticketTypes } from '../../lib/wca-data.js.erb';
import EditPersonTicketPlayground from './TicketPlaygrounds/EditPersonTicketPlayground';

export default function TicketPlayground({ ticketDetails, sync }) {
  const { ticket } = ticketDetails;

  switch (ticket.ticket_type) {
    case ticketTypes.edit_person:
      return <EditPersonTicketPlayground ticketDetails={ticketDetails} sync={sync} />;
    default: return null;
  }
}
