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
  component: StripeWrapper,
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
};

const shouldBeDisabled = (hasPaid, key, activeIndex, index, competitionInfo, isRejected) => {
  const hasRegistrationEditDeadlinePassed = hasPassed(
    competitionInfo.event_change_deadline_date ?? competitionInfo.start_date,
  );
  const editsAllowed = competitionInfo.allow_registration_edits
    && !hasRegistrationEditDeadlinePassed;

  if (isRejected) {
    return true;
  }

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
  qualifications,
}) {
  const isRegistered = Boolean(registration) && registration.competing.registration_status !== 'cancelled';
  const isAccepted = isRegistered && registration.competing.registration_status === 'accepted';
  const isRejected = isRegistered && registration.competing.registration_status === 'rejected';
  const hasPaid = registration?.payment?.has_paid;
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
              competitionInfo,
              isRejected,
            )}
            onClick={() => setActiveIndex(index)}
          >
            <Step.Content>
              <Step.Title>{i18n.t(`${stepConfig.i18nKey}.title`)}</Step.Title>
              <Step.Description>{i18n.t(`${stepConfig.i18nKey}.description`)}</Step.Description>
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
