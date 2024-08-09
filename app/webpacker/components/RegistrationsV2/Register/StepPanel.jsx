import React, { useMemo, useState } from 'react';
import { Step } from 'semantic-ui-react';
import CompetingStep from './CompetingStep';
import RegistrationRequirements from './RegistrationRequirements';
import StripeWrapper from './StripeWrapper';
import i18n from '../../../lib/i18n';
import RegistrationOverview from './RegistrationOverview';
import { hasPassed } from '../../../lib/utils/dates';

const requirementsStepConfig = {
  key: 'requirements',
  description: 'Accept competition terms',
  i18nKey: 'competitions.registration_v2.requirements.title',
  component: RegistrationRequirements,
};

const competingStepConfig = {
  key: 'competing',
  i18nKey: 'competitions.nav.menu.register',
  description: 'Choose your events',
  component: CompetingStep,
};

const paymentStepConfig = {
  key: 'payment',
  description: 'Enter billing information',
  i18nKey: 'registrations.payment_form.labels.payment_information',
  component: StripeWrapper,
};

const registrationOverviewConfig = {
  key: 'approval',
  description: 'By organization team',
  i18nKey: 'competitions.registration_v2.register.approval',
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
};

const shouldBeDisabled = (hasPaid, key, activeIndex, index, competitionInfo) => {
  const editsAllowed = !hasPassed(
    competitionInfo.event_change_deadline_date ?? competitionInfo.start_date,
  );

  if (key === paymentStepConfig.key) {
    return !hasPaid && index > activeIndex;
  }
  if (key === competingStepConfig.key) {
    return index > activeIndex || !editsAllowed;
  }
  if (key === requirementsStepConfig.key) {
    return activeIndex !== 0;
  }
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
  const isAccepted = isRegistered && registration.competing.registration_status === 'accepted';
  const hasPaid = registration?.payment.payment_status === 'succeeded';
  const registrationFinished = hasPaid || (isRegistered && !competitionInfo['using_payment_integrations?']);

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
    // Don't show payment panel if a user was accepted (for people with waived payment)
    if (registrationFinished || isAccepted) {
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
              competitionInfo,
            )}
            onClick={() => setActiveIndex(index)}
          >
            <Step.Content>
              <Step.Title>{i18n.t(stepConfig.i18nKey)}</Step.Title>
              <Step.Description>{stepConfig.description}</Step.Description>
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
