import React from 'react';
import EditPersonForm from '../../../Panel/pages/EditPersonPage/EditPersonForm';
import { ticketStatuses } from '../../../../lib/wca-data.js.erb';
import EditPersonValidations from './EditPersonValidations';
import EditPersonRequestedChanges from './EditPersonRequestedChanges';
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
      <EditPersonRequestedChanges
        ticketId={id}
        currentStakeholder={currentStakeholder}
        requestedChanges={metadata.tickets_edit_person_fields}
        person={metadata.person}
      />
      <EditPersonForm
        wcaId={metadata.wca_id}
        onSuccess={closeTicket}
      />
      <RejectView ticketId={id} currentStakeholder={currentStakeholder} />
    </>
  );
}
