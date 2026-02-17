import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button, Form } from 'semantic-ui-react';
import Loading from '../../../Requests/Loading';
import Errored from '../../../Requests/Errored';
import mergeWcaIdToUser from './api/mergeWcaIdToUser';

export default function MergeWcaIdToUser({
  userId, wcaId, onSuccess,
}) {
  const {
    mutate: mergeWcaIdMutation,
    isPending,
    isError,
    error,
  } = useMutation({
    mutationFn: () => mergeWcaIdToUser(userId, wcaId),
    onSuccess,
  });

  if (isPending) return <Loading />;
  if (isError) return <Errored error={error} />;

  return (
    <Form>
      <p>
        {`The selected duplicate person (${wcaId}) does not have an account. Do you want to assign this WCA ID to the current user?`}
      </p>
      <Button
        primary
        onClick={mergeWcaIdMutation}
      >
        Merge
      </Button>
    </Form>
  );
}
