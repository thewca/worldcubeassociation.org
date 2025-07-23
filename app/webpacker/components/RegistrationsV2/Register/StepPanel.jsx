import React from 'react';
import { Step } from 'semantic-ui-react';
import I18n from '../../../lib/i18n';
import { useStepNavigation } from '../lib/StepNavigationProvider';

export default function StepPanel({
  competitionInfo,
  user,
}) {
  const {
    steps,
    currentStep: {
      Component: CurrentStepPanel,
    },
    activeIndex,
    jumpToStepByIndex,
  } = useStepNavigation();

  return (
    <>
      <Step.Group fluid ordered stackable="tablet">
        {steps.map((stepConfig, index) => (
          <Step
            key={stepConfig.key}
            active={activeIndex === index}
            completed={stepConfig.isCompleted}
            disabled={stepConfig.isDisabled}
            onClick={() => jumpToStepByIndex(index)}
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
        user={user}
      />
    </>
  );
}
