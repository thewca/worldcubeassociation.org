import { useMutation } from '@tanstack/react-query';
import React, { useState } from 'react';
import { Button, Confirm, Message } from 'semantic-ui-react';
import Errored from '../../../Requests/Errored';
import Loading from '../../../Requests/Loading';
import anonymize from './api/anonymize';

export default function AnonymizeAction({ userId, wcaId }) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const {
    mutate: anonymizeMutation,
    isLoading,
    isError,
    isSuccess,
    data,
  } = useMutation({
    mutationFn: anonymize,
  });

  const doAnonymize = () => {
    setConfirmOpen(false);
    anonymizeMutation({ userId, wcaId });
  };

  if (isLoading) return <Loading />;
  if (isError) return <Errored />;

  return (
    <>
      {isSuccess && (
        <>
          <Message info>Anonymization completed.</Message>
          {data?.new_wca_id && <Message info>{`New WCA ID is ${data?.new_wca_id}`}</Message>}
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
