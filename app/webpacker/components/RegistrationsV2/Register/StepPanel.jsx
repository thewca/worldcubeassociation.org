import React, { useMemo, useState } from 'react';
import { Step } from 'semantic-ui-react';
import CompetingStep from './CompetingStep';
import RegistrationRequirements from './RegistrationRequirements';
import I18n from '../../../lib/i18n';
import RegistrationOverview from './RegistrationOverview';
import { useRegistration } from '../lib/RegistrationProvider';
import PaymentStepWrapper from './PaymentStepWrapper';

const requirementsStepConfig = {
  key: 'requirements',
  i18nKey: 'competitions.registration_v2.register.panel.requirements',
  component: RegistrationRequirements,
};

const competingStepConfig = {
  key: 'competing',
  i18nKey: 'competitions.registration_v2.register.panel.competing',
  component: CompetingStep,
};

const paymentStepConfig = {
  key: 'payment',
  i18nKey: 'competitions.registration_v2.register.panel.payment',
  component: PaymentStepWrapper,
};

const registrationOverviewConfig = {
  key: 'approval',
  i18nKey: 'competitions.registration_v2.register.panel.approval',
  component: RegistrationOverview,
};

const shouldShowCompleted = (isRegistered, hasPaid, isAccepted, key, index) => {
  if (key === paymentStepConfig.key) {
    return hasPaid;
  }
  if (key === competingStepConfig.key) {
    return isRegistered;
  }
  if (key === requirementsStepConfig.key) {
    return index > 0;
  }
  if (key === registrationOverviewConfig.key) {
    return isAccepted;
  }
  return false;
};

const shouldBeDisabled = (
  hasPaid,
  key,
  activeIndex,
  index,
  registrationCurrentlyOpen,
  isRejected,
) => {
  if (isRejected) {
    return true;
  }

  if (key === paymentStepConfig.key) {
    return (!hasPaid && index > activeIndex);
  }
  if (key === competingStepConfig.key) {
    return index > activeIndex;
  }
  if (key === requirementsStepConfig.key) {
    return activeIndex !== 0;
  }
  return false;
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
  const CurrentStepPanel = activeIndex === registrationOverviewConfig.index
    ? RegistrationOverview : steps[activeIndex].component;
  return (
    <>
      <Step.Group fluid ordered stackable="tablet">
        {steps.map((stepConfig, index) => (
          <Step
            key={stepConfig.key}
            active={activeIndex === index}
            completed={shouldShowCompleted(
              isRegistered,
              hasPaid,
              isAccepted,
              stepConfig.key,
              activeIndex,
            )}
            disabled={shouldBeDisabled(
              hasPaid,
              stepConfig.key,
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
