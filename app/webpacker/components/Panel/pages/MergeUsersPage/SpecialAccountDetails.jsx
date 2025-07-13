import React from 'react';
import { Message } from 'semantic-ui-react';
import _ from 'lodash';
import { viewUrls } from '../../../../lib/requests/routes.js.erb';

export default function SpecialAccountDetails({ user }) {
  const specialAccountCompetitionKeys = _.keys(user.special_account_competitions);
  if (!user.roles.length && !specialAccountCompetitionKeys.length) {
    return null;
  }

  return (
    <Message>
      <p>{`The user with email ${user.email} is a special account.`}</p>
      {user.roles.length > 0 && (
        <p>
          The user has some roles, you can view them
          {' '}
          <a href={viewUrls.users.rolesEditPage(user.id)}>here</a>
          .
        </p>
      )}
      {specialAccountCompetitionKeys.length && (
        <p>
          Following are the competitions which made the account of user a special account:
          {specialAccountCompetitionKeys.map((specialAccountCompetitionKey) => (
            <p>
              {specialAccountCompetitionKey}
              :
              {user.special_account_competitions[specialAccountCompetitionKey].join(', ')}
            </p>
          ))}
        </p>
      )}
    </Message>
  );
}
