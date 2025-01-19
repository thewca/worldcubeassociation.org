import React, { useState } from 'react';
import { Button, Confirm, Message } from 'semantic-ui-react';
import useSaveAction from '../../../../lib/hooks/useSaveAction';
import Loading from '../../../Requests/Loading';
import { actionUrls } from '../../../../lib/requests/routes.js.erb';

export default function AnonymizeAction({ userId, wcaId }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [completed, setCompleted] = useState(false);

  const { save, saving } = useSaveAction();

  const anonymizeAccount = () => {
    setConfirmOpen(false);
    save(
      actionUrls.tickets.anonymize(userId, wcaId),
      { userId, wcaId },
      () => setCompleted(true),
      { method: 'POST' },
    );
  };

  if (saving) return <Loading />;

  return (
    <>
      {completed && (
        <Message info>Anonymization completed.</Message>
      )}
      <Button
        onClick={() => setConfirmOpen(true)}
      >
        Anonymize
      </Button>
      <Confirm
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={anonymizeAccount}
        content="Are you sure you want to anonymize the account?"
      />
    </>
  );
}
