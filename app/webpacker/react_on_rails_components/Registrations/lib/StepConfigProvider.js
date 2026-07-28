import React, {
  createContext,
  useContext,
  useMemo,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import getRegistrationConfig from '../api/registration/get/get_registration_config';
import { availableSteps } from './stepConfigs';

const StepConfigContext = createContext();

export default function StepConfigProvider({
  competitionId,
  children,
}) {
  const { data: registrationConfig, isFetching } = useQuery({
    queryFn: () => getRegistrationConfig(competitionId),
    queryKey: ['registration-step-config', competitionId],
    placeholderData: [],
  });

  const steps = useMemo(() => (
    registrationConfig.map(
      (config) => {
        const currentStep = availableSteps.find((stepConfig) => stepConfig.key === config.key);

        return { ...config, ...currentStep };
      },
    )
  ), [registrationConfig]);

  const value = useMemo(() => ({
    steps,
    isFetching,
  }), [
    steps,
    isFetching,
  ]);

  return (
    <StepConfigContext.Provider value={value}>
      {children}
    </StepConfigContext.Provider>
  );
}

export const useStepConfig = () => {
  const context = useContext(StepConfigContext);
  if (!context) {
    throw new Error('useRegistration must be used within a RegistrationProvider');
  }
  return context;
};
