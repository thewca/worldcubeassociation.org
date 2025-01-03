import React, { useMemo, useState } from 'react';
import { Button, Dropdown, Icon } from 'semantic-ui-react';
import _ from 'lodash';
import { actionUrls } from '../../../lib/requests/routes.js.erb';
import { ticketStatuses } from '../../../lib/wca-data.js.erb';
import useSaveAction from '../../../lib/hooks/useSaveAction';
import Loading from '../../Requests/Loading';
import useInputState from '../../../lib/hooks/useInputState';

const ticketTypePrefix = 'Tickets';

function StatusViewEditMode({
  ticketDetails, currentStakeholder, onCancel, sync,
}) {
  // metadataType will be a string like TicketsTicketType
  const { ticket: { id, metadata, metadata_type: metadataType } } = ticketDetails;
  // To get ticketType, first remove prefix 'Tickets' and then convert it to snake case.
  const ticketType = _.snakeCase(_.replace(metadataType, ticketTypePrefix, ''));

  const [newStatus, setNewStatus] = useInputState(metadata.status);
  const { save, saving } = useSaveAction();
  const statusOptions = useMemo(() => Object.keys(ticketStatuses[ticketType]).map((key) => ({
    key,
    text: ticketStatuses[ticketType][key],
    value: key,
  })), [ticketType]);

  function saveStatus(status) {
    save(
      actionUrls.tickets.updateStatus(id),
      {
        ticket_status: status,
        acting_stakeholder_id: currentStakeholder.id,
      },
      sync,
      { method: 'POST' },
    );
  }

  if (saving) {
    return <Loading />;
  }

  return (
    <>
      <span>{'Status: '}</span>
      <Dropdown
        inline
        options={statusOptions}
        value={newStatus}
        onChange={setNewStatus}
      />
      {' '}
      <Button
        primary
        disabled={newStatus === metadata.status}
        onClick={() => saveStatus(newStatus)}
      >
        Save
      </Button>
      {' '}
      <Button onClick={onCancel}>Cancel</Button>
    </>
  );
}

export default function StatusView({ ticketDetails, currentStakeholder, sync }) {
  const { ticket: { metadata } } = ticketDetails;
  const [editMode, setEditMode] = useState(false);

  return editMode ? (
    <StatusViewEditMode
      ticketDetails={ticketDetails}
      currentStakeholder={currentStakeholder}
      onCancel={() => setEditMode(false)}
      sync={sync}
    />
  ) : (
    <>
      <span>{`Status: ${metadata.status}`}</span>
      {' '}
      <Icon
        name="edit"
        link
        onClick={() => setEditMode(true)}
      />
    </>
  );
}
