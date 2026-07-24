import React, { useState } from 'react';
import {
  Button, List, Modal, Icon,
} from 'semantic-ui-react';
import { useQueryClient } from '@tanstack/react-query';
import I18n from '../../../lib/i18n';
import AssignWcaIdToUser from '../../Panel/views/AssignWcaIdToUser';

export default function AssignWcaIdView({ user, specialAccount }) {
  const [isModalOpen, setIsModalOpen] = useState();
  const queryClient = useQueryClient();

  const onSuccess = (_unusedData, { wcaId }) => {
    queryClient.setQueryData(['user-details-for-edit', user.id], (old) => ({
      ...old,
      wca_id: wcaId,
    }));
    setIsModalOpen(false);
  };

  return (
    <List.Item>
      <List.Content floated="right">
        <Button
          type="button"
          size="small"
          disabled={specialAccount}
          primary
          onClick={() => setIsModalOpen(true)}
        >
          {I18n.t('users.edit.assign_wca_id')}
        </Button>
      </List.Content>

      <Icon name="user" size="large" verticalAlign="middle" disabled />
      <List.Content>
        <List.Header disabled>None</List.Header>
        <List.Description>No WCA ID assigned</List.Description>
      </List.Content>

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="small"
        closeIcon
      >
        <Modal.Content>
          <AssignWcaIdToUser
            user={user}
            onSuccess={onSuccess}
            requireConfirmation
          />
        </Modal.Content>
      </Modal>
    </List.Item>
  );
}
