import React from 'react';
import { Header, Message, Container } from 'semantic-ui-react';
import I18n from '../../lib/i18n';
import I18nHTMLTranslate from '../I18nHTMLTranslate';
import ContactForm from './ContactForm';
import useLoadedData from '../../lib/hooks/useLoadedData';
import { apiV0Urls } from '../../lib/requests/routes.js.erb';
import Loading from '../Requests/Loading';
import StoreProvider from '../../lib/providers/StoreProvider';
import contactsReducer, { getContactFormInitialState } from './store/reducer';
import useQueryParams from '../../lib/hooks/useQueryParams';

export default function ContactsPage({ recaptchaPublicKey }) {
  const { data: loggedInUserData, loading } = useLoadedData(apiV0Urls.users.me.userDetails);
  const [queryParams] = useQueryParams();

  if (loading) return <Loading />;

  return (
    <StoreProvider
      reducer={contactsReducer}
      initialState={getContactFormInitialState({
        ...queryParams,
        userName: loggedInUserData?.user?.name,
        userEmail: loggedInUserData?.user?.email,
      })}
    >
      <Container text>
        <Header as="h2">{I18n.t('page.contacts.title')}</Header>
        <Message visible>
          <I18nHTMLTranslate
            i18nKey="page.contacts.faq_note_html"
          />
        </Message>
        <ContactForm loggedInUserData={loggedInUserData} recaptchaPublicKey={recaptchaPublicKey} />
      </Container>
    </StoreProvider>
  );
}
