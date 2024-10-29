import React from 'react';
import EditPersonForm from '../../Panel/pages/EditPersonPage/EditPersonForm';
import useSaveAction from '../../../lib/hooks/useSaveAction';
import { actionUrls } from '../../../lib/requests/routes.js.erb';
import Loading from '../../Requests/Loading';

function EditPersonTicketPlaygroundForWrt({ ticketDetails, sync }) {
  const { ticket } = ticketDetails;
  const { save, saving } = useSaveAction();

  const closeTicket = () => {
    save(
      actionUrls.tickets.updateStatus(ticket.id),
      { ticket_status: 'closed' },
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

export default function EditPersonTicketPlayground({ ticketDetails, sync }) {
  const { requester_stakeholders: requesterStakeholders } = ticketDetails;

  return requesterStakeholders.map((requesterStakeholder) => {
    if (requesterStakeholder.stakeholder?.metadata?.friendly_id === 'wrt') {
      return <EditPersonTicketPlaygroundForWrt ticketDetails={ticketDetails} sync={sync} />;
    }
    return null;
  });
}
