import React from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Button, Form, Header, Message,
} from 'semantic-ui-react';
import Loading from '../../../Requests/Loading';
import Errored from '../../../Requests/Errored';
import { useConfirm } from '../../../../lib/providers/ConfirmProvider';
import assignWcaIdToUser from '../../../NewcomerChecks/api/assignWcaIdToUser';
import useInputState from '../../../../lib/hooks/useInputState';
import { IdWcaSearch } from '../../../SearchWidget/WcaSearch';
import SEARCH_MODELS from '../../../SearchWidget/SearchModel';

export default function AssignWcaIdToUser({
  user, prefilledWcaId, onSuccess, requireConfirmation,
}) {
  const confirm = useConfirm();
  const [wcaId, setWcaId] = useInputState(prefilledWcaId ?? '');

  const {
    mutate: assignWcaIdMutation,
    isPending,
    isError,
    error,
  } = useMutation({
    mutationFn: assignWcaIdToUser,
    onSuccess,
  });

  const assignHandler = () => {
    if (requireConfirmation) {
      confirm({
        content: `Are you sure you want to assign WCA ID ${wcaId} to ${user.name}?`,
        confirmButton: 'Assign',
        requireInput: 'ASSIGN WCA ID TO USER',
      })
        .then(() => assignWcaIdMutation({ userId: user.id, wcaId }))
        .catch(() => {});
    } else {
      assignWcaIdMutation({ userId: user.id, wcaId });
    }
  };

  if (isPending) return <Loading />;
  if (isError) return <Errored error={error} />;

  return (
    <>
      <Header>Assign WCA ID</Header>
      <div>
        Enter the WCA ID to assign
        {' '}
        {user.name}
        .
      </div>
      {prefilledWcaId && wcaId !== prefilledWcaId && (
        <Message warning>
          The selected WCA ID (
          {wcaId}
          ) is different from the initial WCA ID (
          {prefilledWcaId}
          ).
        </Message>
      )}
      <Form>
        <Form.Field
          control={IdWcaSearch}
          value={wcaId}
          onChange={setWcaId}
          model={SEARCH_MODELS.person}
          multiple={false}
        />
        <Button primary onClick={assignHandler}>Assign</Button>
      </Form>
    </>
  );
}
