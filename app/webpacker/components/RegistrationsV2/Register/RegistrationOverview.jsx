import React from 'react';
import {
  Button, Icon, Message, Popup, Step,
} from 'semantic-ui-react';
import i18n from '../../../lib/i18n';
import { getMediumDateString, hasPassed } from '../../../lib/utils/dates';

function registrationIconByStatus(registrationStatus) {
  switch (registrationStatus) {
    case 'pending':
      return 'hourglass';
    case 'accepted':
      return 'checkmark';
    case 'cancelled':
      return 'cross';
    default:
      return 'info circle';
  }
}

export default function RegistrationOverview({
  status, steps, competitionInfo, setToUpdate,
}) {
  const hasRegistrationEditDeadlinePassed = hasPassed(
    competitionInfo.event_change_deadline_date ?? competitionInfo.start_date,
  );
  const canUpdateRegistration = competitionInfo.allow_registration_edits
    && !hasRegistrationEditDeadlinePassed;

  return (
    <>
      <Step.Group fluid ordered stackable="tablet">
        {steps.map((stepConfig) => (
          <Step
            key={stepConfig.key}
            completed
          >
            <Step.Content>
              <Step.Title>{i18n.t(stepConfig.i18nKey)}</Step.Title>
            </Step.Content>
          </Step>
        ))}
      </Step.Group>
      <Message
        info={status === 'pending'}
        success={status === 'accepted'}
        negative={status === 'cancelled'}
        icon
      >
        <Icon name={registrationIconByStatus(status)} />
        <Message.Content>
          <Message.Header>
            {i18n.t(
              `competitions.registration_v2.register.registration_status.${status}`,
            )}
          </Message.Header>
        </Message.Content>
      </Message>
      <Popup
        trigger={(
          <Button
            disabled={!canUpdateRegistration}
            primary
            attached
            onClick={setToUpdate}
          >
            {i18n.t('registrations.update')}
          </Button>
      )}
        position="top center"
        content={
        canUpdateRegistration
          ? i18n.t('competitions.registration_v2.register.until', {
            date: getMediumDateString(
              competitionInfo.event_change_deadline_date
              ?? competitionInfo.start_date,
            ),
          })
          : i18n.t('competitions.registration_v2.register.passed')
      }
      />
    </>
  );
}
