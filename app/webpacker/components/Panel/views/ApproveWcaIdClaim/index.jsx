import React from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Button, Header,
} from 'semantic-ui-react';
import Loading from '../../../Requests/Loading';
import Errored from '../../../Requests/Errored';
import { useConfirm } from '../../../../lib/providers/ConfirmProvider';
import confirmWcaId from '../../../NewcomerChecks/api/confirmWcaId';
import WcaIdClaimCancelWarning from '../../../NewcomerChecks/WcaIdClaimCancelWarning';

export default function ApproveWcaIdClaim({
  user, onSuccess, requireConfirmation,
}) {
  const confirm = useConfirm();

  const {
    mutate: approveWcaIdMutation,
    isPending,
    isError,
    error,
  } = useMutation({
    mutationFn: confirmWcaId,
    onSuccess,
  });

  const approveHandler = () => {
    if (requireConfirmation) {
      confirm({
        content: `Are you sure you want to approve WCA ID ${user.unconfirmed_wca_id} to ${user.name}?`,
        confirmButton: 'Approve',
        requireInput: 'APPROVE WCA ID CLAIM',
      })
        .then(() => approveWcaIdMutation({ userId: user.id, wcaId: user.unconfirmed_wca_id }))
        .catch(() => {});
    } else {
      approveWcaIdMutation({ userId: user.id, wcaId: user.unconfirmed_wca_id });
    }
  };

  if (isPending) return <Loading />;
  if (isError) return <Errored error={error} />;

  return (
    <>
      <Header as="h3">
        Approve WCA ID Claim
        <Header.Subheader>
          User
          {' '}
          {user.name}
          {' '}
          has already claimed for this WCA ID (
          {user.unconfirmed_wca_id}
          ) earlier.
        </Header.Subheader>
      </Header>
      <Button primary onClick={approveHandler}>Approve</Button>
      <WcaIdClaimCancelWarning wcaId={user.unconfirmed_wca_id} userId={user.id} />
    </>
  );
}
