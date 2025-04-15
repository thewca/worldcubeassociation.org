import React, { useMemo, useState } from 'react';
import { Step } from 'semantic-ui-react';
import CompetingStep from './CompetingStep';
import RegistrationRequirements from './RegistrationRequirements';
import StripeWrapper from './StripeWrapper';
import I18n from '../../../lib/i18n';
import RegistrationOverview from './RegistrationOverview';
import { useRegistration } from '../lib/RegistrationProvider';

const requirementsStepConfig = {
  key: 'requirements',
  i18nKey: 'competitions.registration_v2.register.panel.requirements',
  component: RegistrationRequirements,
  shouldShowCompleted: (isRegistered, hasPaid, isAccepted, index) => index > 0,
  shouldBeDisabled: (hasPaid, activeIndex) => activeIndex !== 0,
};

const competingStepConfig = {
  key: 'competing',
  i18nKey: 'competitions.registration_v2.register.panel.competing',
  component: CompetingStep,
  shouldShowCompleted: (isRegistered) => isRegistered,
  shouldBeDisabled: (hasPaid, activeIndex, index) => index > activeIndex,
};

const paymentStepConfig = {
  key: 'payment',
  i18nKey: 'competitions.registration_v2.register.panel.payment',
  component: StripeWrapper,
  shouldShowCompleted: (isRegistered, hasPaid) => hasPaid,
  shouldBeDisabled: (
    hasPaid,
    activeIndex,
    index,
    registrationCurrentlyOpen,
  ) => (!hasPaid && index > activeIndex) || !registrationCurrentlyOpen,
};

const registrationOverviewConfig = {
  key: 'approval',
  i18nKey: 'competitions.registration_v2.register.panel.approval',
  component: RegistrationOverview,
  shouldShowCompleted: (isRegistered, hasPaid, isAccepted) => isAccepted,
  shouldBeDisabled: () => false,
};

export default function StepPanel({
  competitionInfo,
  preferredEvents,
  user,
  stripePublishableKey,
  connectedAccountId,
  qualifications,
  registrationCurrentlyOpen,
}) {
  const {
    isRegistered, isAccepted, isRejected, hasPaid, isPolling,
  } = useRegistration();

  const registrationFinished = (isRegistered && hasPaid) || (isRegistered && !competitionInfo['using_payment_integrations?']);

  const steps = useMemo(() => {
    const stepList = [requirementsStepConfig, competingStepConfig];
    if (competitionInfo['using_payment_integrations?']) {
      stepList.push(paymentStepConfig);
    }

    if (isRegistered) {
      stepList.push(registrationOverviewConfig);
    }
    return stepList;
  }, [competitionInfo, isRegistered]);

  const [activeIndex, setActiveIndex] = useState(() => {
    // skip ahead to competingStep if we are processing
    if (isPolling) {
      return steps.findIndex(
        (step) => step === competingStepConfig,
      );
    }
    // Don't show payment panel if a user was accepted (for people with waived payment)
    if (registrationFinished || isAccepted || isRejected) {
      return steps.findIndex(
        (step) => step === (registrationOverviewConfig),
      );
    }
    // If the user has not paid but refreshes the page, we want to display the paymentStep again
    return steps.findIndex(
      (step) => step === (isRegistered ? paymentStepConfig : requirementsStepConfig),
    );
  });
  const CurrentStepPanel = steps[activeIndex].component;
  return (
    <>
      <Step.Group fluid ordered stackable="tablet">
        {steps.map((stepConfig, index) => (
          <Step
            key={stepConfig.key}
            active={activeIndex === index}
            completed={stepConfig.shouldShowCompleted(
              isRegistered,
              hasPaid,
              isAccepted,
              activeIndex,
            )}
            disabled={isRejected || stepConfig.shouldBeDisabled(
              hasPaid,
              activeIndex,
              index,
              registrationCurrentlyOpen,
              isRejected,
            )}
            onClick={() => setActiveIndex(index)}
          >
            <Step.Content>
              <Step.Title>{I18n.t(`${stepConfig.i18nKey}.title`)}</Step.Title>
              <Step.Description>{I18n.t(`${stepConfig.i18nKey}.description`)}</Step.Description>
            </Step.Content>
          </Step>
        ))}
      </Step.Group>
      <CurrentStepPanel
        competitionInfo={competitionInfo}
        preferredEvents={preferredEvents}
        user={user}
        stripePublishableKey={stripePublishableKey}
        connectedAccountId={connectedAccountId}
        qualifications={qualifications}
        nextStep={
          (overwrites = {}) => setActiveIndex((oldActiveIndex) => {
            if (overwrites?.refresh) {
              return oldActiveIndex;
            }
            if (overwrites?.toStart) {
              return 0;
            }
            if (overwrites?.goBack) {
              return oldActiveIndex - 1;
            }
            const registrationOverviewIndex = steps.findIndex(
              (step) => step === registrationOverviewConfig,
            );
            if (oldActiveIndex === registrationOverviewIndex) {
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
