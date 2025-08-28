import React from 'react';
import EditPersonForm from '../../../Panel/pages/EditPersonPage/EditPersonForm';
import { ticketStatuses } from '../../../../lib/wca-data.js.erb';
import EditPersonValidations from './EditPersonValidations';
import EditPersonRequestedChangesList from './EditPersonRequestedChangesList';
import RejectView from './RejectView';

export default function EditPersonActionerView({
  ticketDetails,
  currentStakeholder,
  updateStatus,
}) {
  const { ticket: { id, metadata } } = ticketDetails;

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
        requestedChanges={metadata.tickets_edit_person_fields}
      />
      <EditPersonForm
        wcaId={metadata.wca_id}
        onSuccess={closeTicket}
      />
      <RejectView ticketId={id} currentStakeholder={currentStakeholder} />
    </>
  );
}
