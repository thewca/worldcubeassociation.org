import React, { useState } from 'react';
import { Button, Modal, Icon } from 'semantic-ui-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import I18n from '../../../lib/i18n';
import UserItem from '../../SearchWidget/UserItem';
import confirmWcaId from '../api/confirmWcaId';
import clearClaimWcaId from '../api/clearClaimWcaId';

export default function HandleClaimModal({ userId, person, disabled }) {
  const [open, setOpen] = useState();
  const queryClient = useQueryClient();
  const onSuccess = () => {
    // We might be able to use setQueryData here to avoid additional fetch, but this
    // component will get removed within a few days (once the tickets are in for WCA ID
    // claims). So not spending time to use setQueryData here.
    queryClient.invalidateQueries({ queryKey: ['user-details-for-edit', userId] });
    // Invalidate the person query for cache consistency across the site.
    // This component will unmount once the user details are refreshed.
    queryClient.invalidateQueries({ queryKey: ['person', person.id] });
    setOpen(false);
  };

  const { mutate: confirmWcaIdMutation, isPending: isConfirmingPending } = useMutation({
    mutationFn: confirmWcaId,
    onSuccess,
  });

  const { mutate: clearClaimWcaIdMutation, isPending: isClearingPending } = useMutation({
    mutationFn: clearClaimWcaId,
    onSuccess,
  });

  return (
    <Modal
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      trigger={(
        <Button
          size="small"
          disabled={disabled}
        >
          {I18n.t('users.edit.handle_claim')}
        </Button>
      )}
      size="small"
    >
      <Modal.Header>{I18n.t('users.edit.handle_claim')}</Modal.Header>
      <Modal.Content>
        <p>
          {I18n.t('users.edit.approve_confirm', { wca_id: person.id })}
        </p>
        <UserItem item={person} />
      </Modal.Content>
      <Modal.Actions>
        <Button
          color="green"
          onClick={() => confirmWcaIdMutation({ userId, wcaId: person.id })}
          loading={isConfirmingPending}
        >
          <Icon name="checkmark" />
          {' '}
          {I18n.t('users.edit.approve')}
        </Button>
        <Button
          color="red"
          onClick={() => clearClaimWcaIdMutation({ userId })}
          loading={isClearingPending}
        >
          <Icon name="remove" />
          {' '}
          {I18n.t('users.edit.clear_claim')}
        </Button>
        <Button onClick={() => setOpen(false)}>
          {I18n.t('users.edit.cancel')}
        </Button>
      </Modal.Actions>
    </Modal>
  );
}
