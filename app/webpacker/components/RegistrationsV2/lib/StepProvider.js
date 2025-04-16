import React, {
  useMemo, useReducer,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import getRegistrationConfig from '../api/registration/get/get_registration_config';
import {
  availableSteps,
  registrationOverviewConfig,
} from './stepConfigs';
import StepContext from './StepContext';
import { useRegistration } from './RegistrationProvider';

export default function StepProvider({ competitionInfo, children }) {
  const {
    isRegistered, isAccepted, hasPaid,
  } = useRegistration();

  const { data: registrationConfig, isLoading } = useQuery({
    queryFn: () => getRegistrationConfig(competitionInfo),
    queryKey: ['registration-config', competitionInfo.id],
  });

  const steps = useMemo(() => {
    if (registrationConfig) {
      return registrationConfig.map(
        (config) => availableSteps.find((stepConfig) => stepConfig.key === config.key),
      ).concat([registrationOverviewConfig]);
    }
    return [];
  }, [registrationConfig]);

  const [activeIndex, dispatchStep] = useReducer(
    (state, action) => {
      switch (true) {
        case action?.refresh: return state;
        case action?.toStart: return 0;
        case action?.next: return state + 1;
        case action?.set: return action.index;
        default: throw Error('unrecognised action');
      }
    },
    0,
  );

  const CurrentStepPanel = useMemo(() => {
    if (steps.length > 0) {
      return steps[activeIndex].component;
    }
    return null;
  }, [activeIndex, steps]);

  const currentStepParameters = useMemo(() => {
    if (steps.length > 0) {
      return registrationConfig.find((config) => config.key === steps[activeIndex].key)?.parameters;
    }
    return {};
  }, [activeIndex, registrationConfig, steps]);

  const value = useMemo(() => ({
    steps,
    CurrentStepPanel,
    currentStepParameters,
    nextStep: () => dispatchStep({ next: true }),
    refreshStep: () => dispatchStep({ refresh: true }),
    jumpToStart: () => dispatchStep({ toStart: true }),
    jumpToStepByIndex: (index) => dispatchStep({ set: true, index }),
    jumpToStepByKey: (key) => dispatchStep({
      set: true,
      index: steps.findIndex(
        (stepConfig) => stepConfig.key === key,
      ),
    }),
    jumpToFirstIncompleteStep: () => {
      dispatchStep({
        set: true,
        index: steps.findIndex(
          (stepConfig) => !stepConfig.shouldShowCompleted(isRegistered, hasPaid, isAccepted, 1),
        ),
      });
    },
    activeIndex,
    isLoading,
  }), [CurrentStepPanel,
    activeIndex,
    currentStepParameters,
    hasPaid,
    isAccepted,
    isLoading,
    isRegistered,
    steps]);

  return (
    <StepContext.Provider value={value}>
      {children}
    </StepContext.Provider>
  );
}
