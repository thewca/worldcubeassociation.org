import React from 'react';
import TicketWorkbenches from './TicketWorkbenches';
import TicketHeader from './TicketHeader';
import TicketComments from './TicketComments';
import TicketLogs from './TicketLogs';

export default function TicketContent({ ticketDetails, currentStakeholder, updateStatus }) {
  const { ticket: { metadata_type: ticketType } } = ticketDetails;
  const stakeholderRole = currentStakeholder.stakeholder_role;
  const TicketWorkbench = TicketWorkbenches[ticketType]?.[stakeholderRole];

  return (
    <>
      <TicketHeader
        ticketDetails={ticketDetails}
        currentStakeholder={currentStakeholder}
        updateStatus={updateStatus}
      />
      {TicketWorkbench && (
        <TicketWorkbench
          ticketDetails={ticketDetails}
          updateStatus={updateStatus}
          currentStakeholder={currentStakeholder}
        />
      )}
      <TicketComments
        ticketId={ticketDetails.ticket.id}
        currentStakeholder={currentStakeholder}
      />
      <TicketLogs
        ticketId={ticketDetails.ticket.id}
      />
    </>
  );
}
