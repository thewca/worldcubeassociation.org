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
import { IdWcaSearch } from '../SearchWidget/WcaSearch';
import SEARCH_MODELS from '../SearchWidget/SearchModel';

const CONTACT_EDIT_PROFILE_QUERY_CLIENT = new QueryClient();

export default function ContactEditProfilePage({ loggedInUserId, recaptchaPublicKey }) {
  const [queryParams] = useQueryParams();
  const editOthersProfileMode = Boolean(queryParams.editOthersProfile);
  const { data: loggedInUserData, isLoading, isError } = useQuery({
    queryKey: ['userData'],
    queryFn: () => fetchJsonOrError(apiV0Urls.users.me.userDetails),
    enabled: (
      // If not logged in, fetching WCA ID of logged in user is not possible.
      !!loggedInUserId
      // If the user needs to edit other's profile, then fetching own WCA ID is not needed.
       || !editOthersProfileMode
    ),
  }, CONTACT_EDIT_PROFILE_QUERY_CLIENT);
  const { loggedInUserPermissions, loading } = useLoggedInUserPermissions();
  const [inputWcaId, setInputWcaId] = useInputState();
  const [contactSuccess, setContactSuccess] = useState(false);

  const wcaId = editOthersProfileMode ? inputWcaId : loggedInUserData?.data?.user?.wca_id;

  if (isLoading || loading) return <Loading />;
  if (isError) return <Errored />;

  if (!loggedInUserId) {
    return (
      <Message error>
        <I18nHTMLTranslate i18nKey="page.contact_edit_profile.not_logged_in_error" />
      </Message>
    );
  }
  if (loggedInUserData && !wcaId) {
    return (
      <Message error>
        <I18nHTMLTranslate i18nKey="page.contact_edit_profile.no_profile_error" />
      </Message>
    );
  }
  if (editOthersProfileMode && !loggedInUserPermissions.canRequestToEditOthersProfile) {
    return (
      <Message error>
        <I18nHTMLTranslate i18nKey="page.contact_edit_profile.no_permission_error" />
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

  return (
    <Container text>
      <Header as="h2">{I18n.t('page.contact_edit_profile.title')}</Header>
      {editOthersProfileMode && (
        <IdWcaSearch
          model={SEARCH_MODELS.person}
          multiple={false}
          value={inputWcaId}
          onChange={setInputWcaId}
          disabled={!!inputWcaId}
          label={I18n.t('page.contact_edit_profile.form.wca_id_search.label')}
        />
      )}
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
