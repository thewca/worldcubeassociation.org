import React, { useMemo, useState } from 'react';
import { Step } from 'semantic-ui-react';
import I18n from '../../../lib/i18n';
import CompetingStep from './CompetingStep';
import RegistrationRequirements from './RegistrationRequirements';
import StripeWrapper from './StripeWrapper';

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

  const steps = useMemo(() => {
    if (competitionInfo['using_payment_integrations?'] && !hasPaid) {
      return [requirementsStepConfig, competingStepConfig, paymentStepConfig];
    }

    if (hasPaid) {
      return [requirementsStepConfig, paymentStepConfig, competingStepConfig];
    }

    return [requirementsStepConfig, competingStepConfig];
  }, [competitionInfo, hasPaid]);

  const [activeIndex, setActiveIndex] = useState(() => steps.findIndex(
    // eslint-disable-next-line no-nested-ternary
    (step) => step === (isRegistered ? hasPaid ? competingStepConfig : paymentStepConfig : requirementsStepConfig),
  ));

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
              <Step.Title>{I18n.t(stepConfig.i18nKey)}</Step.Title>
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
