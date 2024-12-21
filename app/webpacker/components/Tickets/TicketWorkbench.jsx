import React from 'react';
import { ticketTypes } from '../../lib/wca-data.js.erb';
import EditPersonTicketWorkbench from './TicketWorkbenches/EditPersonTicketWorkbench';

export default function TicketWorkbench({ ticketDetails, sync, currentStakeholder }) {
  const { ticket } = ticketDetails;

  switch (ticket.metadata_type) {
    case ticketTypes.edit_person:
      return (
        <EditPersonTicketWorkbench
          ticketDetails={ticketDetails}
          sync={sync}
          currentStakeholder={currentStakeholder}
        />
      );
    default: return null;
  }
}
