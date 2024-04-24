import React from 'react';
import { Header, Message, Container } from 'semantic-ui-react';
import I18n from '../../lib/i18n';
import I18nHTMLTranslate from '../I18nHTMLTranslate';
import ContactForm from './ContactForm';
import useLoadedData from '../../lib/hooks/useLoadedData';
import { apiV0Urls } from '../../lib/requests/routes.js.erb';
import Loading from '../Requests/Loading';

export default function ContactsPage() {
  const { data: userDetails, loading } = useLoadedData(apiV0Urls.users.me.userDetails);

  if (loading) return <Loading />;

  return (
    <Container fluid>
      <Header as="h2">{I18n.t('page.contacts.title')}</Header>
      <Message visible>
        <I18nHTMLTranslate
          i18nKey="page.contacts.faq_note_html"
        />
      </Message>
      <ContactForm userDetails={userDetails} />
    </Container>
  );
}
