import React from 'react';
import {
  Button, ButtonGroup, Form, FormField, Header, Message, Segment,
} from 'semantic-ui-react';
import i18n from '../../../lib/i18n';
import EventIcon from '../../wca/EventIcon';
import { hasPassed } from '../../../lib/utils/dates';
import { events } from '../../../lib/wca-data.js.erb';

function updateRegistrationKey(editsAllowed, deadlinePassed) {
  if (!editsAllowed && !deadlinePassed) {
    return 'competitions.registration_v2.update.no_self_update';
  }
  if (deadlinePassed) {
    return 'competitions.registration_v2.register.passed';
  }
  return 'competitions.registration_v2.register.until';
}

export default function RegistrationOverview({
  nextStep, registration, competitionInfo,
}) {
  const hasRegistrationEditDeadlinePassed = hasPassed(
    competitionInfo.event_change_deadline_date ?? competitionInfo.start_date,
  );
  const editsAllowed = competitionInfo.allow_registration_edits
    && !hasRegistrationEditDeadlinePassed;

  const deleteAllowed = (registration.competing.registration_status !== 'accepted'
      || competitionInfo.allow_registration_self_delete_after_acceptance);

  return (
    <>
      { !editsAllowed && (
      <Message info>
        {i18n.t(updateRegistrationKey(editsAllowed, hasRegistrationEditDeadlinePassed))}
      </Message>
      )}
      { !competitionInfo['using_payment_integrations?'] && registration.competing.registration_status === 'pending' && competitionInfo.base_entry_fee_lowest_denomination && (
        <Message info>
          {i18n.t('registrations.wont_pay_here')}
        </Message>
      )}
      <Segment>
        <Header>{i18n.t('competitions.nav.menu.registration')}</Header>
        <Form onSubmit={nextStep} size="large">
          <FormField>
            <label>
              {i18n.t('activerecord.attributes.registration.registration_competition_events')}
              :
            </label>
            { /* Make sure to keep WCA Event order */}
            {events.official.flatMap((e) => (registration.competing.event_ids.includes(e.id) ? <EventIcon key={e.id} id={e.id} style={{ cursor: 'unset' }} /> : []))}
          </FormField>
          <FormField />
          <FormField>
            <label>
              {i18n.t('activerecord.attributes.registration.comments')}
              :
            </label>
            {registration.competing.comment.length > 0 ? registration.competing.comment : i18n.t('competitions.schedule.rooms_panel.none')}
          </FormField>
          <FormField />
          <FormField>
            <label>
              {i18n.t('activerecord.attributes.registration.guests')}
              :
            </label>
            {registration.guests}
          </FormField>
          <ButtonGroup widths={2}>
            { editsAllowed && (
            <Button
              primary
              type="submit"
            >
              {i18n.t('registrations.update')}
            </Button>
            )}
            { deleteAllowed && (
            <Button
              negative
              type="submit"
            >
              {i18n.t('registrations.delete_registration')}
            </Button>
            )}
          </ButtonGroup>
        </Form>
      </Segment>
    </>
  );
}
