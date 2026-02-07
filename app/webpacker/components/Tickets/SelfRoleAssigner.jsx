import React, { useState } from 'react';
import {
  Button, Dropdown, Message, Modal,
} from 'semantic-ui-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useInputState from '../../lib/hooks/useInputState';
import I18n from '../../lib/i18n';
import { ticketStakeholderConnections } from '../../lib/wca-data.js.erb';
import joinAsBccStakeholder from './api/joinAsBccStakeholder';
import getEligibleRoles from './api/getEligibleRoles';
import Loading from '../Requests/Loading';
import Errored from '../Requests/Errored';

// let i18n-tasks know the key is used
// i18n-tasks-use t('tickets.stakeholder_role.actioner')
// i18n-tasks-use t('tickets.stakeholder_role.requester')

export default function SelfRoleAssigner({ ticketId }) {
  const queryClient = useQueryClient();
  const [isAssigning, setIsAssigning] = useState();
  const [selectedRole, setSelectedRole] = useInputState();

  const {
    data: eligibleRoles,
    isPending: isPendingEligibleRoles,
    isError: isErrorEligibleRoles,
    error: errorEligibleRoles,
  } = useQuery({
    queryKey: ['eligible-roles', ticketId],
    queryFn: () => getEligibleRoles({ ticketId }),
  });

  const roleOptions = (eligibleRoles || []).map((role) => ({
    key: role,
    text: I18n.t(`tickets.stakeholder_role.${role}`),
    value: role,
  }));

  const {
    mutate: joinAsBccStakeholderMutate,
    isPending,
    isError,
    error,
  } = useMutation({
    mutationFn: joinAsBccStakeholder,
    onSuccess: () => {
      queryClient.invalidateQueries(['ticket-details', ticketId]);
    },
  });

  const createBccStakeholder = () => {
    joinAsBccStakeholderMutate({
      ticketId,
      connection: ticketStakeholderConnections.bcc,
      stakeholderRole: selectedRole,
      isActive: true,
    });
  };

  if (isPending || isPendingEligibleRoles) return <Loading />;
  if (isError) return <Errored error={error} />;
  if (isErrorEligibleRoles) return <Errored error={errorEligibleRoles} />;

  return (
    <>
      <Message warning>
        <Message.Header>No Ticket Access</Message.Header>
        <p>You currently don&apos;t have permission to perform any actions on this ticket.</p>
        <p>You can assign a role to yourself to gain access.</p>
        <Button primary onClick={() => setIsAssigning(true)}>
          Click here to assign a role for yourself
        </Button>
      </Message>
      <Modal open={isAssigning}>
        <Modal.Header>Assign Yourself a Role</Modal.Header>
        <Modal.Content>
          Please select the role you wish to assume for this ticket:
          <Dropdown
            placeholder="Select a role..."
            fluid
            selection
            options={roleOptions}
            onChange={setSelectedRole}
            value={selectedRole}
          />
        </Modal.Content>
        <Modal.Actions>
          <Button
            onClick={() => setIsAssigning(false)}
            content="Cancel"
          />
          <Button
            primary
            disabled={!selectedRole}
            onClick={createBccStakeholder}
            content="Create"
          />
        </Modal.Actions>
      </Modal>
    </>
  );
}
