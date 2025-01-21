import React, { useState } from 'react';
import { Form, Header } from 'semantic-ui-react';
import useCheckboxState from '../../../lib/hooks/useCheckboxState';
import I18n from '../../../lib/i18n';
import I18nHTMLTranslate from '../../I18nHTMLTranslate';
import { EventSelector } from '../../wca/EventSelector';

export default function PreferencesTab({ user }) {
  const [preferredEvents, setPreferredEvents] = useState(user.preferred_events.map((e) => e.id));
  const [resultsPostedNotification,
    setResultsPostedNotification] = useCheckboxState(user.results_notifications_enabled);
  const [registrationNotifications,
    setRegistrationNotifications] = useCheckboxState(user.registration_notifications_enabled);

  return (
    <>
      <EventSelector
        selectedEvents={preferredEvents}
        onEventSelection={({ event }) => setPreferredEvents(event)}
      />
      <Header>{I18n.t('layouts.navigation.notifications')}</Header>
      <Form>
        <Form.Checkbox label={I18n.t('activerecord.attributes.user.results_notifications_enabled')} checked={resultsPostedNotification} onChange={setResultsPostedNotification} />
        <Form.Checkbox label={I18n.t('activerecord.attributes.user.registration_notifications_enabled')} checked={registrationNotifications} onChange={setRegistrationNotifications} />
        <I18nHTMLTranslate i18nKey="simple_form.hints.user.registration_notifications_enabled" />
      </Form>
    </>
  );
}
