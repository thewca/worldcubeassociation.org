import React from 'react';
import {
  Button, Form, Header, Message,
} from 'semantic-ui-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import updateUserGroup from '../api/updateUserGroup';
import Errored from '../../../../Requests/Errored';
import { useConfirm } from '../../../../../lib/providers/ConfirmProvider';

export default function ActiveStatus({ userGroup, nonLeadRoles }) {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const isActive = userGroup?.is_active;

  const {
    mutate: updateUserGroupMutation, isPending, isError, error,
  } = useMutation({
    mutationFn: updateUserGroup,
    onSuccess: (data) => {
      queryClient.setQueryData(['user_group', userGroup.id], data);
    },
  });

  const hasNonLeadRoles = nonLeadRoles.length > 0;
  const disableSwitch = isPending || (isActive && hasNonLeadRoles);
  const showWarning = isActive && hasNonLeadRoles;

  const handleToggleActive = () => {
    if (isActive) {
      confirm({
        content: 'Deactivating this group will automatically end any lead roles of this group. Are you sure you want to proceed?',
      }).then(() => {
        updateUserGroupMutation({
          id: userGroup.id,
          is_active: false,
        });
      });
    } else {
      updateUserGroupMutation({
        id: userGroup.id,
        is_active: true,
      });
    }
  };

  return (
    <Form loading={isPending} warning={showWarning} error={isError}>
      {isError && <Errored error={error.message || error} />}
      <Form.Field>
        <Header as="h4">Active Status</Header>
        <div style={{ marginBottom: '1em' }}>
          {'Current Status: '}
          <strong>
            {isActive ? 'Active' : 'Inactive'}
          </strong>
        </div>
        <Button
          type="button"
          onClick={handleToggleActive}
          disabled={disableSwitch}
        >
          {'Switch to '}
          {isActive ? 'inactive' : 'active'}
        </Button>
        {showWarning && (
          <Message warning>
            <p>Cannot deactivate group while it has active non-lead roles.</p>
          </Message>
        )}
      </Form.Field>
    </Form>
  );
}
