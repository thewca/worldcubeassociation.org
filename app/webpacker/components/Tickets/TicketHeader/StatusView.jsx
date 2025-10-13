import React, { useMemo, useState } from 'react';
import { Button, Dropdown, Icon } from 'semantic-ui-react';
import _ from 'lodash';
import { ticketStatuses } from '../../../lib/wca-data.js.erb';
import useInputState from '../../../lib/hooks/useInputState';

const ticketTypePrefix = 'Tickets';

function StatusViewEditMode({ ticketDetails, onCancel, updateStatus }) {
  // metadataType will be a string like TicketsTicketType
  const { ticket: { metadata, metadata_type: metadataType } } = ticketDetails;
  // To get ticketType, first remove prefix 'Tickets' and then convert it to snake case.
  const ticketType = _.snakeCase(_.replace(metadataType, ticketTypePrefix, ''));

  const [newStatus, setNewStatus] = useInputState(metadata.status);
  const statusOptions = useMemo(() => Object.keys(ticketStatuses[ticketType]).map((key) => ({
    key,
    text: ticketStatuses[ticketType][key],
    value: key,
  })), [ticketType]);

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
        onClick={() => updateStatus(newStatus)}
      >
        Save
      </Button>
      {' '}
      <Button onClick={onCancel}>Cancel</Button>
    </>
  );
}

export default function StatusView({ ticketDetails, currentStakeholder, updateStatus }) {
  const { ticket: { metadata } } = ticketDetails;
  const [editMode, setEditMode] = useState(false);

  return editMode ? (
    <StatusViewEditMode
      ticketDetails={ticketDetails}
      currentStakeholder={currentStakeholder}
      onCancel={() => setEditMode(false)}
      updateStatus={updateStatus}
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
