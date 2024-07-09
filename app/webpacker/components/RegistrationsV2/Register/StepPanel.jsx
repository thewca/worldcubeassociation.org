import React, { useMemo, useState } from 'react';
import { Icon, Message, Step } from 'semantic-ui-react';
import CompetingStep from './CompetingStep';
import RegistrationRequirements from './RegistrationRequirements';
import StripeWrapper from './StripeWrapper';
import i18n from '../../../lib/i18n';
import RegistrationOverview from './RegistrationOverview';
import RegistrationStatus from './RegistrationStatus';

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

const registrationOverviewConfig = {
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
  const isRegistered = Boolean(registration) && registration.competing.registration_status !== 'cancelled';
  const registrationSucceeded = isRegistered && registration.competing.registration_status === 'accepted';
  const hasPaid = registration?.payment.payment_status === 'succeeded';
  const registrationFinished = hasPaid || (isRegistered && !competitionInfo['using_payment_integrations?']);

  const steps = useMemo(() => {
    if (competitionInfo['using_payment_integrations?']) {
      return [requirementsStepConfig, competingStepConfig, paymentStepConfig];
    }

    return [requirementsStepConfig, competingStepConfig];
  }, [competitionInfo]);

  const [activeIndex, setActiveIndex] = useState(() => {
    // Don't show payment panel if a user was accepted (for people with waived payment)
    if (registrationFinished || registrationSucceeded) {
      return registrationOverviewConfig.index;
    }
    // If the user has not paid but refreshes the page, we want to display the paymentStep again
    return steps.findIndex(
      (step) => step === (isRegistered ? paymentStepConfig : requirementsStepConfig),
    );
  });
  const CurrentStepPanel = activeIndex === registrationOverviewConfig.index
    ? RegistrationOverview : steps[activeIndex].component;
  return (
    <>
      { isRegistered && (
        <RegistrationStatus registration={registration} />
      )}
      <Step.Group fluid ordered stackable="tablet">
        {steps.map((stepConfig, index) => (
          <Step
            key={stepConfig.key}
            active={activeIndex === index}
            completed={registrationFinished || activeIndex > index}
            disabled={!registrationFinished && activeIndex < index}
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
          (overwrites = {}) => setActiveIndex((oldActiveIndex) => {
            if (overwrites?.refresh) {
              return oldActiveIndex;
            }
            if (overwrites?.toStart) {
              return 0;
            }
            if (oldActiveIndex === steps.length - 1) {
              return registrationOverviewConfig.index;
            }
            if (oldActiveIndex === registrationOverviewConfig.index) {
              return steps.findIndex(
                (step) => step === competingStepConfig,
              );
            }
            return oldActiveIndex + 1;
          })
      }
      />
    </>
  );
}
