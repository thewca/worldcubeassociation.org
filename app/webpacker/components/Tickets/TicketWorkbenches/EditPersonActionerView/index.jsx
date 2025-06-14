import React from 'react';
import EditPersonForm from '../../../Panel/pages/EditPersonPage/EditPersonForm';
import useSaveAction from '../../../../lib/hooks/useSaveAction';
import { actionUrls } from '../../../../lib/requests/routes.js.erb';
import { ticketStatuses } from '../../../../lib/wca-data.js.erb';
import Loading from '../../../Requests/Loading';
import EditPersonValidations from './EditPersonValidations';
import EditPersonRequestedChangesList from './EditPersonRequestedChangesList';

export default function EditPersonActionerView({ ticketDetails, sync, currentStakeholder }) {
  const { ticket } = ticketDetails;
  const { save, saving } = useSaveAction();

  const closeTicket = () => {
    save(
      actionUrls.tickets.updateStatus(ticket.id),
      {
        ticket_status: ticketStatuses.edit_person.closed,
        acting_stakeholder_id: currentStakeholder.id,
      },
      sync,
      { method: 'POST' },
    );
  };

  if (ticketDetails.ticket.metadata.status === ticketStatuses.edit_person.closed) {
    return null;
  }
  if (saving) return <Loading />;

  return (
    <>
      <EditPersonValidations
        ticketDetails={ticketDetails}
      />
      <EditPersonRequestedChangesList
        requestedChanges={ticket.metadata?.tickets_edit_person_fields}
      />
      <EditPersonForm
        wcaId={ticket.metadata.wca_id}
        onSuccess={closeTicket}
      />
    </>
  );
}
