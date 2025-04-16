import React from 'react';
import { Step } from 'semantic-ui-react';
import I18n from '../../../lib/i18n';
import { useRegistration } from '../lib/RegistrationProvider';
import useSteps from '../hooks/useSteps';

export default function StepPanel({
  competitionInfo,
  preferredEvents,
  user,
  personalRecords,
  registrationCurrentlyOpen,
}) {
  const {
    isRegistered, isAccepted, isRejected, hasPaid,
  } = useRegistration();

  const {
    steps, CurrentStepPanel, activeIndex, jumpToIndex,
  } = useSteps();

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
            onClick={() => jumpToIndex(index)}
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
        personalRecords={personalRecords}
      />
    </>
  );
}
