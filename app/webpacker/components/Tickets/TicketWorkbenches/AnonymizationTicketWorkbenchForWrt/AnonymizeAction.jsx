import { useMutation } from '@tanstack/react-query';
import React, { useState } from 'react';
import { Button, Confirm, Message } from 'semantic-ui-react';
import Errored from '../../../Requests/Errored';
import Loading from '../../../Requests/Loading';
import anonymize from './api/anonymize';

export default function AnonymizeAction({ userId, wcaId }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [newWcaId, setNewWcaId] = useState();

  const {
    mutate: anonymizeMutation,
    isLoading,
    isError,
  } = useMutation({
    mutationFn: anonymize,
    onSuccess: (data) => {
      setCompleted(true);
      if (data.new_wca_id) {
        setNewWcaId(data.new_wca_id);
      }
    },
  });

  const doAnonymize = () => {
    setConfirmOpen(false);
    anonymizeMutation({ userId, wcaId });
  };

  if (isLoading) return <Loading />;
  if (isError) return <Errored />;

  return (
    <>
      {completed && (
        <>
          <Message info>Anonymization completed.</Message>
          {newWcaId && <Message info>{`New WCA ID is ${newWcaId}`}</Message>}
        </>
      )}
      <Button
        onClick={() => setConfirmOpen(true)}
      >
        Anonymize
      </Button>
      <Confirm
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={doAnonymize}
        content="Are you sure you want to anonymize?"
      />
    </>
  );
}
