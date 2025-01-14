import React, { useState } from 'react';
import {
  Button, Confirm, Header, Loader,
  Message,
} from 'semantic-ui-react';
import { actionUrls } from '../../../../lib/requests/routes.js.erb';
import useSaveAction from '../../../../lib/hooks/useSaveAction';

export default function AccountAnonymization({ userId, disabled = false }) {
  const [completed, setCompleted] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { save, saving } = useSaveAction();

  const anonymizeAccount = () => {
    setConfirmOpen(false);
    save(
      actionUrls.users.anonymize(userId),
      null,
      () => setCompleted(true),
      { method: 'POST' },
    );
  };

  return (
    <>
      <Header as="h4">Account anonymization</Header>
      {completed && (
        <Message info>Account anonymization completed.</Message>
      )}
      {saving && <Loader active inline="centered" />}
      {!completed && !saving && (
        <Button
          disabled={disabled}
          onClick={() => setConfirmOpen(true)}
        >
          Anonymize account
        </Button>
      )}
      <Confirm
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={anonymizeAccount}
        content="Are you sure you want to anonymize the account?"
      />
    </>
  );
}
