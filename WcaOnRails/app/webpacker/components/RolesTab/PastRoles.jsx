import React from 'react';
import { Header, List } from 'semantic-ui-react';
import { getRoleDescription, getRoleSubDescription } from '../../lib/helpers/roles-tab';

export default function PastRoles({ pastRoles }) {
  return (
    <>
      <Header>Past Roles</Header>
      <List divided relaxed>
        {pastRoles?.map((role) => (
          <List.Item key={role.id}>
            <List.Content>
              <List.Header>{getRoleDescription(role)}</List.Header>
              <List.Description>{getRoleSubDescription(role)}</List.Description>
            </List.Content>
          </List.Item>
        ))}
      </List>
    </>
  );
}
