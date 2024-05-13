import React, { useMemo, useState } from 'react';
import { Step } from 'semantic-ui-react';
import CompetingStep from './CompetingStep';
import RegistrationRequirements from './RegistrationRequirements';
import StripeWrapper from './StripeWrapper';
import i18n from '../../../lib/i18n';
import RegistrationOverview from './RegistrationOverview';

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

const registrationOverViewConfig = {
  index: -100,
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
    if (competitionInfo['using_payment_integrations?']) {
      return [requirementsStepConfig, competingStepConfig, paymentStepConfig];
    }

    return [requirementsStepConfig, competingStepConfig];
  }, [competitionInfo]);

  const [activeIndex, setActiveIndex] = useState(() => {
    if (hasPaid || (isRegistered && !competitionInfo['using_payment_integrations?'])) {
      return -100;
    }
    // If the user has not paid but refreshes the page, we want to display the paymentStep again
    return steps.findIndex(
      (step) => step === (isRegistered ? paymentStepConfig : requirementsStepConfig),
    );
  });

  if (activeIndex === registrationOverViewConfig.index) {
    const status = registration.competing.registration_status;
    return (
      <RegistrationOverview
        status={status}
        steps={steps}
        competitionInfo={competitionInfo}
        setToUpdate={
        () => setActiveIndex(steps.findIndex((step) => step.key === competingStepConfig.key))
}
      />
    );
  }
  const CurrentStepPanel = steps[activeIndex].component;

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
      <CurrentStepPanel
        registration={registration}
        refetchRegistration={refetchRegistration}
        competitionInfo={competitionInfo}
        preferredEvents={preferredEvents}
        user={user}
        stripePublishableKey={stripePublishableKey}
        connectedAccountId={connectedAccountId}
        nextStep={
          () => setActiveIndex((oldActiveIndex) => {
            if (oldActiveIndex === steps.length - 1) {
              return registrationOverViewConfig.index;
            }
            return oldActiveIndex + 1;
          })
      }
      />
    </>
  );
}
