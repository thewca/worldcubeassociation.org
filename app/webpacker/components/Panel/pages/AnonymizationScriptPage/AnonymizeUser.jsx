import React, { useState } from 'react';
import { Button, List, Message } from 'semantic-ui-react';
import useLoadedData from '../../../../lib/hooks/useLoadedData';
import { apiV0Urls, actionUrls, adminAnonymizePersonUrl } from '../../../../lib/requests/routes.js.erb';
import Loading from '../../../Requests/Loading';
import Errored from '../../../Requests/Errored';
import useSaveAction from '../../../../lib/hooks/useSaveAction';

const ANONYMOUS_ACCOUNT_EMAIL_ID_SUFFIX = '@worldcubeassociation.org';
const ANONYMOUS_ACCOUNT_NAME = 'Anonymous';
const ANONYMOUS_ACCOUNT_DOB = '1954-12-04';
const ANONYMOUS_ACCOUNT_GENDER = 'o';
const ANONYMOUS_ACCOUNT_COUNTRY_ISO2 = 'US';

const isAccountAnonymized = (user) => (
  user && user.email === (user.id + ANONYMOUS_ACCOUNT_EMAIL_ID_SUFFIX)
    && user.name === ANONYMOUS_ACCOUNT_NAME
    && user.wca_id === null
    && user.dob === ANONYMOUS_ACCOUNT_DOB
    && user.gender === ANONYMOUS_ACCOUNT_GENDER
    && user.country_iso2 === ANONYMOUS_ACCOUNT_COUNTRY_ISO2
);

export default function AnonymizeUser({ userId, onSuccess }) {
  const { data, loading, error } = useLoadedData(apiV0Urls.users.show([userId]));
  const { save, saving } = useSaveAction();
  const [saveError, setSaveError] = useState(null);

  const userData = data?.users[0];
  const accountAnonymized = isAccountAnonymized(userData);
  const anonymizeAccountAction = () => {
    save(actionUrls.panel.anonymizeUser, {
      userId: userData.id,
    }, onSuccess, { method: 'POST' }, setSaveError);
  };

  if (loading || saving) return <Loading />;
  if (error || saveError) return <Errored />;

  return (
    <>
      <List>
        <List.Item>{`Anonymization dashboard for user with user ID ${userId}`}</List.Item>
        <List.Item>
          {userData.wca_id
            ? 'The user has both account and profile.' : 'The user has only account.'}
        </List.Item>
      </List>
      {accountAnonymized && <Message positive>The user is already anonymous.</Message>}
      {!accountAnonymized && userData.wca_id && (
        <Button href={adminAnonymizePersonUrl}>Go to Anonymize Person script</Button>
      )}
      {!accountAnonymized && !userData.wca_id && (
        <Button onClick={anonymizeAccountAction}>Anonymize account</Button>
      )}
    </>
  );
}
