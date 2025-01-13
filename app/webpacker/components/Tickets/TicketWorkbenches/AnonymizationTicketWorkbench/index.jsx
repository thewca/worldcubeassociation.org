import React from 'react';
import { Container, Header, List } from 'semantic-ui-react';
import { adminAnonymizePersonUrl } from '../../../../lib/requests/routes.js.erb';
import AccountAnonymization from './AccountAnonymization';

export default function AnonymizationTicketWorkbench({ userId, wcaId }) {
  const shouldAnonymizeAccount = !!userId;
  const shouldAnonymizeProfile = !!wcaId;

  return (
    <Container>
      <Header>Anonymization Dashboard</Header>

      <List bulleted>
        {shouldAnonymizeAccount && <List.Item>{`User ID to anonymize: ${userId}`}</List.Item>}
        {shouldAnonymizeProfile && <List.Item>{`WCA ID to anonymize: ${wcaId}`}</List.Item>}
      </List>

      {shouldAnonymizeAccount && <AccountAnonymization userId={userId} />}
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
