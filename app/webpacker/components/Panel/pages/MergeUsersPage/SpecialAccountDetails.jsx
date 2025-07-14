import React from 'react';
import { List, Message } from 'semantic-ui-react';
import _ from 'lodash';
import { viewUrls } from '../../../../lib/requests/routes.js.erb';

export default function SpecialAccountDetails({ user }) {
  const specialAccountCompetitionKeys = _.keys(user.special_account_competitions);
  if (!user.roles.length && !specialAccountCompetitionKeys.length) {
    return null;
  }

  return (
    <Message>
      <Message.Header>{`The user with email ${user.email} is a special account.`}</Message.Header>
      {user.roles.length > 0 && (
        <p>
          The user has some roles, you can view them
          {' '}
          <a href={viewUrls.users.rolesEditPage(user.id)}>here</a>
          .
        </p>
      )}
      <List divided relaxed>
        {specialAccountCompetitionKeys.length && (
        <List.Item>
          {specialAccountCompetitionKeys.map((specialAccountCompetitionKey) => (
            <List.Content>
              <List.Header>{specialAccountCompetitionKey}</List.Header>
              <List.Description>
                {user.special_account_competitions[specialAccountCompetitionKey].join(', ')}
              </List.Description>
            </List.Content>
          ))}
        </List.Item>
        )}
      </List>
    </Message>
  );
}
