import React from 'react';
import {
  Button, Form, FormField, Header, Message, Segment, TransitionGroup,
} from 'semantic-ui-react';
import i18n from '../../../lib/i18n';
import EventIcon from '../../wca/EventIcon';
import { hasPassed } from '../../../lib/utils/dates';

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

  return (
    <>
      { !editsAllowed && (
      <Message info>
        {i18n.t(updateRegistrationKey(editsAllowed, hasRegistrationEditDeadlinePassed))}
      </Message>
      )}
      <TransitionGroup animation="slide down">
        <Segment>
          <Header>{i18n.t('competitions.nav.menu.registration')}</Header>
          <Form onSubmit={nextStep}>
            <FormField>
              <label>{i18n.t('activerecord.attributes.registration.registration_competition_events')}</label>
              {registration.competing.event_ids.map((id) => (<EventIcon key={id} id={id} style={{ cursor: 'unset' }} />))}
            </FormField>
            <FormField>
              <label>{i18n.t('competitions.registration_v2.register.comment')}</label>
              {registration.competing.comment.length > 0 ? registration.competing.comment : i18n.t('competitions.schedule.rooms_panel.none')}
            </FormField>
            <FormField>
              <label>{i18n.t('activerecord.attributes.registration.guests')}</label>
              {registration.guests}
            </FormField>
            { editsAllowed && (
            <Button
              primary
              type="submit"
            >
              {i18n.t('registrations.update')}
            </Button>
            )}
          </Form>
        </Segment>
      </TransitionGroup>
    </>
  );
}
