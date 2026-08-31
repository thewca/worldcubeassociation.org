import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { List, Message } from 'semantic-ui-react';
import getPendingClaims from './api/getPendingClaims';
import Loading from '../Requests/Loading';
import Errored from '../Requests/Errored';
import { viewUrls } from '../../lib/requests/routes.js.erb';

export default function WcaIdClaimCancelWarning({ wcaId, userId }) {
  const {
    data: users = [], isFetching, isError, error,
  } = useQuery({
    queryKey: ['pending-claims', wcaId],
    queryFn: () => getPendingClaims({ wcaId }),
  });

  if (isFetching) return <Loading />;
  if (isError) return <Errored error={error} />;

  const otherUsers = users.filter((u) => u.id !== userId);
  const claimCount = otherUsers.length;

  if (claimCount === 0) return null;

  return (
    <Message warning>
      <Message.Header>Conflicting claims</Message.Header>
      <Message.Content>
        <p>
          Note: When the WCA ID is assigned to this account, the pending claims for
          this WCA ID from the following
          {' '}
          {claimCount}
          {' '}
          account(s) will be automatically declined, and those users will be notified:
        </p>
        <List bulleted>
          {otherUsers.map((u) => (
            <List.Item key={u.id}>
              <a
                href={viewUrls.users.showForEdit(u.id)}
                target="_blank"
                rel="noreferrer"
              >
                {u.name}
              </a>
              {' '}
              (
              {u.email}
              )
            </List.Item>
          ))}
        </List>
      </Message.Content>
    </Message>
  );
}
