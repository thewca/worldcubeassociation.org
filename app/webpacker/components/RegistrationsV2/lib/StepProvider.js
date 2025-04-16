import React, {
  useMemo, useReducer,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRegistration } from './RegistrationProvider';
import getRegistrationConfig from '../api/registration/get/get_registration_config';
import {
  availableSteps,
  competingStepConfig,
  paymentStepConfig,
  registrationOverviewConfig,
  requirementsStepConfig,
} from './stepConfigs';
import StepContext from './StepContext';

export default function StepProvider({ competitionInfo, children }) {
  const {
    isRegistered, isAccepted, isRejected, hasPaid, isPolling,
  } = useRegistration();

  const { data: registrationConfig, isLoading } = useQuery({
    queryFn: () => getRegistrationConfig(competitionInfo),
    queryKey: ['registration-config', competitionInfo.id],
  });

  const registrationFinished = (isRegistered && hasPaid) || (isRegistered && !competitionInfo['using_payment_integrations?']);

  const steps = useMemo(() => {
    if (registrationConfig) {
      return availableSteps.filter(
        (stepConfig) => registrationConfig.includes(stepConfig.key),
      );
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
    null,
    () => {
      if (registrationConfig) {
        if (isPolling) {
          return steps.findIndex((step) => step === competingStepConfig);
        }

        if (registrationFinished || isAccepted || isRejected) {
          return steps.findIndex((step) => step === registrationOverviewConfig);
        }

        return steps.findIndex(
          (step) => step === (isRegistered ? paymentStepConfig : requirementsStepConfig),
        );
      }
      return 0;
    },
  );

  const CurrentStepPanel = useMemo(() => {
    if (steps.length > 0) {
      return steps[activeIndex].component;
    }
    return null;
  }, [activeIndex, steps]);

  const value = useMemo(() => ({
    steps,
    CurrentStepPanel,
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
    activeIndex,
    isLoading,
  }), [CurrentStepPanel, activeIndex, isLoading, steps]);

  return (
    <StepContext.Provider value={value}>
      {children}
    </StepContext.Provider>
  );
}
