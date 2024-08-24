import React, { useState } from 'react';
import { Container, Header, Message } from 'semantic-ui-react';
import { QueryClient, useQuery } from '@tanstack/react-query';
import i18n from '../../lib/i18n';
import I18nHTMLTranslate from '../I18nHTMLTranslate';
import { apiV0Urls } from '../../lib/requests/routes.js.erb';
import Loading from '../Requests/Loading';
import { fetchJsonOrError } from '../../lib/requests/fetchWithAuthenticityToken';
import Errored from '../Requests/Errored';
import EditProfileFormWithWcaId from './EditProfileFormWithWcaId';

const CONTACT_EDIT_PROFILE_QUERY_CLIENT = new QueryClient();

export default function ContactEditProfilePage({ loggedInUserId, recaptchaPublicKey }) {
  const { data: loggedInUserData, isLoading, isError } = useQuery({
    queryKey: ['userData'],
    queryFn: () => fetchJsonOrError(apiV0Urls.users.me.userDetails),
    enabled: !!loggedInUserId,
  }, CONTACT_EDIT_PROFILE_QUERY_CLIENT);
  const wcaId = loggedInUserData?.data?.user?.wca_id;
  const [contactSuccess, setContactSuccess] = useState(false);

  if (isLoading) return <Loading />;
  if (isError) return <Errored />;
  if (loggedInUserData && !wcaId) {
    return (
      <Message error>
        <I18nHTMLTranslate i18nKey="page.contact_edit_profile.no_profile_error" />
      </Message>
    );
  }

  if (contactSuccess) {
    return (
      <Message
        success
        content={i18n.t('page.contact_edit_profile.success_message')}
      />
    );
  }

  return (
    <Container text>
      <Header as="h2">{i18n.t('page.contact_edit_profile.title')}</Header>
      <EditProfileFormWithWcaId
        wcaId={wcaId}
        loggedInUserData={loggedInUserData}
        setContactSuccess={setContactSuccess}
        recaptchaPublicKey={recaptchaPublicKey}
      />
    </Container>
  );
}
