import React from 'react';
import {
  List, Header, Segment, Message,
} from 'semantic-ui-react';
import { useQuery } from '@tanstack/react-query';
import I18n from '../../../lib/i18n';
import WCAQueryClientProvider from '../../../lib/providers/WCAQueryClientProvider';
import ConfirmProvider from '../../../lib/providers/ConfirmProvider';

import getUserDetails from '../api/getUserDetails';
import Loading from '../../Requests/Loading';
import Errored from '../../Requests/Errored';

import WcaIdPersonView from './WcaIdPersonView';
import AssignWcaIdView from './AssignWcaIdView';

export default function Wrapper({ userId }) {
  return (
    <WCAQueryClientProvider>
      <ConfirmProvider>
        <EditUserWcaId userId={userId} />
      </ConfirmProvider>
    </WCAQueryClientProvider>
  );
}

export function EditUserWcaId({ userId }) {
  const {
    data: userDetails,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ['user-details-for-edit', userId],
    queryFn: () => getUserDetails(userId),
  });

  if (isPending) return <Loading />;
  if (isError) return <Errored error={error} />;

  const {
    wca_id: wcaId,
    unconfirmed_wca_id: unconfirmedWcaId,
    'special_account?': specialAccount,
  } = userDetails;

  return (
    <Segment secondary>
      <Header
        as="h5"
        content={I18n.t(unconfirmedWcaId
          ? 'activerecord.attributes.user.unconfirmed_wca_id'
          : 'activerecord.attributes.user.wca_id')}
      />

      <List verticalAlign="middle" relaxed="very">
        {(!wcaId && !unconfirmedWcaId) ? (
          <AssignWcaIdView
            user={userDetails}
          />
        ) : (
          <WcaIdPersonView
            userId={userId}
            personId={unconfirmedWcaId || wcaId}
            isConfirmed={!unconfirmedWcaId}
            specialAccount={specialAccount}
          />
        )}
      </List>

      {specialAccount && (
        <Message
          warning
          size="tiny"
          content={I18n.t('users.edit.account_is_special')}
        />
      )}
    </Segment>
  );
}
