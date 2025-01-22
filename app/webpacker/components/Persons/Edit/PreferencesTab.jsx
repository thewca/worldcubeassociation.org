import React, { useCallback, useState } from 'react';
import {
  Form, Header, Message, Segment,
} from 'semantic-ui-react';
import { useMutation } from '@tanstack/react-query';
import useCheckboxState from '../../../lib/hooks/useCheckboxState';
import I18n from '../../../lib/i18n';
import I18nHTMLTranslate from '../../I18nHTMLTranslate';
import { EventSelector } from '../../wca/EventSelector';
import { updatePreferences } from '../api/updatePreferences';

export default function PreferencesTab({ user }) {
  const [preferredEvents, setPreferredEvents] = useState(user.preferred_events.map((e) => e.id));
  const [resultsPostedNotification,
    setResultsPostedNotification] = useCheckboxState(user.results_notifications_enabled);
  const [registrationNotifications,
    setRegistrationNotifications] = useCheckboxState(user.registration_notifications_enabled);
  const {
    mutate: updatePreferenceMutation,
    isSuccess,
    isError,
    isPending,
  } = useMutation({ mutationFn: updatePreferences });

  const onSubmit = useCallback((event) => {
    event.preventDefault();
    updatePreferenceMutation({
      userId: user.id,
      registrationNotificationsEnabled: registrationNotifications,
      resultsNotificationsEnabled: resultsPostedNotification,
      preferredEventIds: preferredEvents,
    });
  }, [
    preferredEvents,
    registrationNotifications,
    resultsPostedNotification,
    updatePreferenceMutation,
    user.id,
  ]);

  return (
    <Segment loading={isPending}>
      { isSuccess && <Message success>{I18n.t('users.successes.messages.account_updated')}</Message>}
      { isError && <Message error>Something went wrong updating your Preferences</Message>}
      <EventSelector
        selectedEvents={preferredEvents}
        onEventSelection={({ eventId }) => setPreferredEvents(
          (prev) => (prev.includes(eventId)
            ? prev.filter((e) => e !== eventId)
            : [...prev, eventId]),
        )}
      />
      <Header>{I18n.t('layouts.navigation.notifications')}</Header>
      <Form onSubmit={onSubmit}>
        <Form.Field>
          <Form.Checkbox
            label={I18n.t('activerecord.attributes.user.results_notifications_enabled')}
            checked={resultsPostedNotification}
            onChange={setResultsPostedNotification}
          />
        </Form.Field>
        <Form.Field>
          <Form.Checkbox
            label={I18n.t('activerecord.attributes.user.registration_notifications_enabled')}
            checked={registrationNotifications}
            onChange={setRegistrationNotifications}
          />
          <I18nHTMLTranslate i18nKey="simple_form.hints.user.registration_notifications_enabled" />
        </Form.Field>
        <Form.Button type="submit" disabled={isPending}>Save</Form.Button>
      </Form>
    </Segment>
  );
}
