import React from 'react';
import EditPersonForm from '../../Panel/pages/EditPersonPage/EditPersonForm';
import useSaveAction from '../../../lib/hooks/useSaveAction';
import { actionUrls } from '../../../lib/requests/routes.js.erb';
import { ticketStatuses } from '../../../lib/wca-data.js.erb';
import Loading from '../../Requests/Loading';

function EditPersonTicketWorkbenchForWrt({ ticketDetails, actingStakeholderId, sync }) {
  const { ticket } = ticketDetails;
  const { save, saving } = useSaveAction();

  const closeTicket = () => {
    save(
      actionUrls.tickets.updateStatus(ticket.id),
      {
        ticket_status: ticketStatuses.edit_person.closed,
        acting_stakeholder_id: actingStakeholderId,
      },
      sync,
      { method: 'POST' },
    );
  };

  if (saving) return <Loading />;

  return (
    <EditPersonForm
      wcaId={ticket.metadata.wca_id}
      onSuccess={closeTicket}
    />
  );
}

export default function EditPersonTicketWorkbench({ ticketDetails, sync, currentStakeholder }) {
  if (ticketDetails.ticket.metadata.status === ticketStatuses.edit_person.closed) {
    return null;
  }

  if (currentStakeholder.stakeholder?.metadata?.friendly_id === 'wrt') {
    return (
      <EditPersonTicketWorkbenchForWrt
        ticketDetails={ticketDetails}
        actingStakeholderId={currentStakeholder.id}
        sync={sync}
      />
    );
  }
  return null;
}
