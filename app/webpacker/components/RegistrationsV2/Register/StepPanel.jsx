import React, { useMemo, useState } from 'react';
import {
  Button, Icon, Message, Popup, Step,
} from 'semantic-ui-react';
import CompetingStep from './CompetingStep';
import RegistrationRequirements from './RegistrationRequirements';
import StripeWrapper from './StripeWrapper';
import i18n from '../../../lib/i18n';
import { getMediumDateString, hasPassed } from '../../../lib/utils/dates';

const requirementsStepConfig = {
  key: 'requirements',
  i18nKey: 'competitions.registration_v2.requirements.title',
  component: RegistrationRequirements,
};
const competingStepConfig = {
  key: 'competing',
  i18nKey: 'competitions.nav.menu.register',
  component: CompetingStep,
};
const paymentStepConfig = {
  key: 'payment',
  i18nKey: 'registrations.payment_form.labels.payment_information',
  component: StripeWrapper,
};

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

export default function StepPanel({
  competitionInfo,
  preferredEvents,
  user,
  registration,
  refetchRegistration,
  stripePublishableKey,
  connectedAccountId,
}) {
  const isRegistered = Boolean(registration);
  const hasPaid = registration?.payment.payment_status === 'succeeded';

  const hasRegistrationEditDeadlinePassed = hasPassed(
    competitionInfo.event_change_deadline_date ?? competitionInfo.start_date,
  );
  const canUpdateRegistration = competitionInfo.allow_registration_edits
    && !hasRegistrationEditDeadlinePassed;

  const steps = useMemo(() => {
    if (competitionInfo['using_payment_integrations?']) {
      return [requirementsStepConfig, competingStepConfig, paymentStepConfig];
    }

    return [requirementsStepConfig, competingStepConfig];
  }, [competitionInfo]);

  const [activeIndex, setActiveIndex] = useState(() => {
    if (hasPaid) {
      return -1;
    }
    return steps.findIndex(
      (step) => step === (isRegistered ? paymentStepConfig : requirementsStepConfig),
    );
  });

  if (activeIndex === -1) {
    const status = registration.competing.registration_status;
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
              onClick={() => setActiveIndex(1)}
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

  const CurrentStepPanel = steps[activeIndex].component;
  const stepName = steps[activeIndex].key;

  return (
    <>
      <Step.Group fluid ordered stackable="tablet">
        {steps.map((stepConfig, index) => (
          <Step
            key={stepConfig.key}
            active={activeIndex === index}
            completed={activeIndex > index}
            disabled={activeIndex < index}
          >
            <Step.Content>
              <Step.Title>{i18n.t(stepConfig.i18nKey)}</Step.Title>
            </Step.Content>
          </Step>
        ))}
      </Step.Group>
      { stepName === 'payment' ? (
        <CurrentStepPanel
          registration={registration}
          refetchRegistration={refetchRegistration}
          competitionInfo={competitionInfo}
          preferredEvents={preferredEvents}
          user={user}
          stripePublishableKey={stripePublishableKey}
          connectedAccountId={connectedAccountId}
          nextStep={() => {}}
        />
      )
        : (
          <CurrentStepPanel
            registration={registration}
            refetchRegistration={refetchRegistration}
            competitionInfo={competitionInfo}
            preferredEvents={preferredEvents}
            user={user}
            nextStep={() => setActiveIndex((oldActiveIndex) => oldActiveIndex + 1)}
          />
        )}

    </>
  );
}
