import React, { useState } from 'react';
import { Container, Header, Message } from 'semantic-ui-react';
import { QueryClient, useQuery } from '@tanstack/react-query';
import I18n from '../../lib/i18n';
import I18nHTMLTranslate from '../I18nHTMLTranslate';
import { apiV0Urls } from '../../lib/requests/routes.js.erb';
import Loading from '../Requests/Loading';
import { fetchJsonOrError } from '../../lib/requests/fetchWithAuthenticityToken';
import Errored from '../Requests/Errored';
import EditProfileForm from './EditProfileForm';
import useLoggedInUserPermissions from '../../lib/hooks/useLoggedInUserPermissions';
import useQueryParams from '../../lib/hooks/useQueryParams';
import useInputState from '../../lib/hooks/useInputState';
import WcaSearch from '../SearchWidget/WcaSearch';
import SEARCH_MODELS from '../SearchWidget/SearchModel';

const CONTACT_EDIT_PROFILE_QUERY_CLIENT = new QueryClient();

function ContactEditProfileSelf({ setContactSuccess, recaptchaPublicKey }) {
  const { data: loggedInUserData, isLoading, isError } = useQuery({
    queryKey: ['userData'],
    queryFn: () => fetchJsonOrError(apiV0Urls.users.me.userDetails),
  }, CONTACT_EDIT_PROFILE_QUERY_CLIENT);
  const wcaId = loggedInUserData?.data?.user?.wca_id;

  if (isLoading) return <Loading />;
  if (isError) return <Errored />;
  if (!wcaId) {
    return (
      <Message error>
        <I18nHTMLTranslate i18nKey="page.contact_edit_profile.no_profile_error" />
      </Message>
    );
  }

  return (
    <Container text>
      <Header as="h2">{I18n.t('page.contact_edit_profile.title')}</Header>
      <EditProfileForm
        wcaId={wcaId}
        onContactSuccess={() => setContactSuccess(true)}
        recaptchaPublicKey={recaptchaPublicKey}
      />
    </Container>
  );
}

function ContactEditProfileOthers({ setContactSuccess, recaptchaPublicKey }) {
  const { loggedInUserPermissions, loading } = useLoggedInUserPermissions();
  const [person, setPerson] = useInputState();
  const wcaId = person?.id;

  if (loading) return <Loading />;

  if (!loggedInUserPermissions.canRequestToEditOthersProfile) {
    return (
      <Message error>
        <I18nHTMLTranslate i18nKey="page.contact_edit_profile.no_permission_error" />
      </Message>
    );
  }

  return (
    <Container text>
      <Header as="h2">{I18n.t('page.contact_edit_profile.title')}</Header>
      <WcaSearch
        model={SEARCH_MODELS.person}
        multiple={false}
        value={person}
        onChange={setPerson}
        disabled={!!wcaId}
        label={I18n.t('page.contact_edit_profile.form.wca_id_search.label')}
      />
      {wcaId && (
        <EditProfileForm
          wcaId={wcaId}
          onContactSuccess={() => setContactSuccess(true)}
          recaptchaPublicKey={recaptchaPublicKey}
        />
      )}
    </Container>
  );
}

export default function ContactEditProfilePage({ loggedInUserId, recaptchaPublicKey }) {
  const [queryParams] = useQueryParams();
  const [contactSuccess, setContactSuccess] = useState(false);

  if (!loggedInUserId) {
    return (
      <Message error>
        <I18nHTMLTranslate i18nKey="page.contact_edit_profile.not_logged_in_error" />
      </Message>
    );
  }
  if (contactSuccess) {
    return (
      <Message
        success
        content={I18n.t('page.contact_edit_profile.success_message')}
      />
    );
  }

  if (queryParams.editOthersProfile) {
    return (
      <ContactEditProfileOthers
        setContactSuccess={setContactSuccess}
        recaptchaPublicKey={recaptchaPublicKey}
      />
    );
  }
  return (
    <ContactEditProfileSelf
      setContactSuccess={setContactSuccess}
      recaptchaPublicKey={recaptchaPublicKey}
    />
  );
}
