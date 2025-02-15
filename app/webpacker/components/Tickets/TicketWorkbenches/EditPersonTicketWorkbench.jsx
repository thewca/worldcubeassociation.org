import React from 'react';
import { Header, Message, Table } from 'semantic-ui-react';
import EditPersonForm from '../../Panel/pages/EditPersonPage/EditPersonForm';
import useSaveAction from '../../../lib/hooks/useSaveAction';
import { actionUrls } from '../../../lib/requests/routes.js.erb';
import { ticketStatuses } from '../../../lib/wca-data.js.erb';
import Loading from '../../Requests/Loading';
import useLoadedData from '../../../lib/hooks/useLoadedData';
import Errored from '../../Requests/Errored';
import I18n from '../../../lib/i18n';

function formatField(field, value) {
  return field === 'name' ? value.replace(' ', '#') : value;
}

function EditPersonValidations({ ticketDetails }) {
  const { ticket } = ticketDetails;
  const {
    data: validators, loading, error,
  } = useLoadedData(actionUrls.tickets.editPersonValidators(ticket.id));

  if (loading) return <Loading />;
  if (error) return <Errored />;

  return [
    ...validators.name,
    ...validators.dob,
  ].map((validator) => (
    <Message warning>{I18n.t(`validators.${validator.kind}.${validator.id}`, validator.args)}</Message>
  ));
}

function EditPersonRequestedChangesList({ requestedChanges }) {
  return (
    <>
      <Header as="h3">Requested changes</Header>
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Field</Table.HeaderCell>
            <Table.HeaderCell>Old value</Table.HeaderCell>
            <Table.HeaderCell>New value</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {requestedChanges.map((change) => (
            <Table.Row>
              <Table.Cell>{I18n.t(`activerecord.attributes.user.${change.field_name}`)}</Table.Cell>
              <Table.Cell>{formatField(change.field_name, change.old_value)}</Table.Cell>
              <Table.Cell>{formatField(change.field_name, change.new_value)}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </>
  );
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
      <EditPersonRequestedChangesList
        requestedChanges={ticketDetails.ticket.metadata?.tickets_edit_person_fields}
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
