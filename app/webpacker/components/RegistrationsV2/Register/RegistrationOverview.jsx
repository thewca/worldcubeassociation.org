import React from 'react';
import {
  Button, Icon, Message, Step,
} from 'semantic-ui-react';
import i18n from '../../../lib/i18n';

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
  status, steps, setToUpdate,
}) {
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
      <Button
        primary
        attached
        onClick={setToUpdate}
      >
        {i18n.t('competitions.registration_v2.register.view')}
      </Button>
    </>
  );
}
