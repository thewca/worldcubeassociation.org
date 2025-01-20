import React from 'react';
import {
  Container, Header, List, Message,
} from 'semantic-ui-react';
import { adminAnonymizePersonUrl } from '../../../../lib/requests/routes.js.erb';
import AccountAnonymization from './AccountAnonymization';

export default function AnonymizationTicketWorkbench({ userId, wcaId }) {
  const shouldAnonymizeAccount = !!userId;
  const shouldAnonymizeProfile = !!wcaId;

  return (
    <Container>
      <Header>Anonymization Dashboard</Header>

      {!shouldAnonymizeAccount && !shouldAnonymizeProfile && (
        <Message info>No user/person to anonymize.</Message>
      )}

      <List bulleted>
        {shouldAnonymizeAccount && <List.Item>{`User ID to anonymize: ${userId}`}</List.Item>}
        {shouldAnonymizeProfile && <List.Item>{`WCA ID to anonymize: ${wcaId}`}</List.Item>}
      </List>

      {shouldAnonymizeAccount && (
        <AccountAnonymization
          userId={userId}
          // If there is a person that is connected to the account, then this button shouldn't be
          // clicked, instead old anonymization script needs to be used. This disabling is a kind of
          // hack, once this workbench is expanded by adding more things like verifications, etc,
          // then this disabling will be removed.
          disabled={shouldAnonymizeProfile}
        />
      )}
      {shouldAnonymizeProfile && (
        <>
          <Header as="h4">Profile anonymization</Header>
          {'Anonymize profile using '}
          <a href={adminAnonymizePersonUrl}>old anonymization script</a>
        </>
      )}

    </Container>
  );
}
