import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button, Form } from 'semantic-ui-react';
import Loading from '../../../Requests/Loading';
import Errored from '../../../Requests/Errored';
import { useConfirm } from '../../../../lib/providers/ConfirmProvider';
import assignWcaIdToUser from '../../../NewcomerChecks/api/assignWcaIdToUser';

export default function AssignWcaIdToUser({ userId, wcaId, onSuccess }) {
  const confirm = useConfirm();

  const {
    mutate: assignWcaIdMutation,
    isPending,
    isError,
    error,
  } = useMutation({
    mutationFn: assignWcaIdToUser,
    onSuccess,
  });

  const confirmAssign = () => {
    confirm({
      content: `The selected duplicate person (${wcaId}) does not have an account. Do you want to assign this WCA ID to the current user?`,
      confirmButton: 'Assign WCA ID',
      requireInput: 'ASSIGN WCA ID TO USER',
    }).then(() => assignWcaIdMutation({ userId, wcaId }));
  };

  if (isPending) return <Loading />;
  if (isError) return <Errored error={error} />;

  return (
    <Form>
      <Form.Input label="WCA ID" value={wcaId} disabled />
      <Button primary onClick={confirmAssign}>Assign</Button>
    </Form>
  );
}
