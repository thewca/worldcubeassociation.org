import React from 'react';
import EditPersonForm from '../../../Panel/pages/EditPersonPage/EditPersonForm';
import { ticketStatuses } from '../../../../lib/wca-data.js.erb';
import EditPersonValidations from './EditPersonValidations';
import EditPersonRequestedChangesList from './EditPersonRequestedChangesList';

export default function EditPersonActionerView({ ticketDetails, updateStatus }) {
  const { ticket } = ticketDetails;

  const closeTicket = () => updateStatus(ticketStatuses.edit_person.closed);

  if (ticketDetails.ticket.metadata.status === ticketStatuses.edit_person.closed) {
    return null;
  }

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
