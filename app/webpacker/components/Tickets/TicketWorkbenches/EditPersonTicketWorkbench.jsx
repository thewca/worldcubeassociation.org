import React from 'react';
import { Message } from 'semantic-ui-react';
import EditPersonForm from '../../Panel/pages/EditPersonPage/EditPersonForm';
import useSaveAction from '../../../lib/hooks/useSaveAction';
import { actionUrls } from '../../../lib/requests/routes.js.erb';
import { ticketStatuses } from '../../../lib/wca-data.js.erb';
import Loading from '../../Requests/Loading';
import useLoadedData from '../../../lib/hooks/useLoadedData';
import Errored from '../../Requests/Errored';

function EditPersonValidations({ ticketDetails }) {
  const { ticket } = ticketDetails;
  const {
    data: validators, loading, error,
  } = useLoadedData(actionUrls.tickets.editPersonValidators(ticket.id));

  if (loading) return <Loading />;
  if (error) return <Errored />;

  return validators.dob.map((validator) => (
    <Message warning>{validator.message}</Message>
  ));
}

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
    <>
      <EditPersonValidations
        ticketDetails={ticketDetails}
      />
      <EditPersonForm
        wcaId={ticket.metadata.wca_id}
        onSuccess={closeTicket}
      />
    </>
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
