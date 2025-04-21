import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
} from 'react';

const StepNavigationContext = createContext();

export default function StepNavigationProvider({
  stepsConfiguration,
  availableSteps,
  payload,
  summaryPanelKey = null,
  navigationDisabled = false,
  children,
}) {
  const summaryPanelConfig = useMemo(() => (
    availableSteps.find((stepConfig) => stepConfig.key === summaryPanelKey)
  ), [availableSteps, summaryPanelKey]);

  const extendedStepsConfig = useMemo(() => {
    if (summaryPanelConfig) {
      return [...stepsConfiguration, summaryPanelConfig];
    }

    return stepsConfiguration;
  }, [stepsConfiguration, summaryPanelConfig]);

  const findStepIndexByKey = useCallback((key) => extendedStepsConfig.findIndex(
    (stepConfig) => stepConfig.key === key,
  ), [extendedStepsConfig]);

  const defaultStepIndex = useMemo(() => {
    if (summaryPanelConfig) {
      const summaryComplete = summaryPanelConfig.isCompleted(payload);

      if (summaryComplete || navigationDisabled) {
        return findStepIndexByKey(summaryPanelConfig.key);
      }
    }

    const firstIncomplete = stepsConfiguration.find(
      (step) => !step.isCompleted(payload),
    );

    if (firstIncomplete) {
      return findStepIndexByKey(firstIncomplete.key);
    }

    if (summaryPanelConfig) {
      // We did not find an incomplete step. Implicitly, this means that all steps are complete!
      return findStepIndexByKey(summaryPanelConfig.key);
    }

    return 0;
  }, [
    findStepIndexByKey,
    navigationDisabled,
    payload,
    stepsConfiguration,
    summaryPanelConfig,
  ]);

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
    defaultStepIndex,
  );

  const isStepDisabled = useCallback((stepConfig, stepIndex) => {
    if (navigationDisabled) {
      return stepConfig.key !== summaryPanelKey;
    }

    // The step in question already passed.
    if (stepIndex < activeIndex) {
      return !stepConfig.isEditable;
    }

    // The step in question is still in the future.
    if (stepIndex > activeIndex) {
      const completeAndEditable = stepConfig.isCompleted(payload) && stepConfig.isEditable;

      return stepConfig.key !== summaryPanelKey && !completeAndEditable;
    }

    // If we reach here, this implicitly means `stepIndex == activeIndex`.
    //   The current step should never be locked, to avoid awkward situations.
    return false;
  }, [navigationDisabled, activeIndex, summaryPanelKey, payload]);

  const steps = useMemo(() => (
    extendedStepsConfig.map((step, index) => ({
      ...step,
      isCompleted: step.isCompleted(payload),
      isDisabled: isStepDisabled(step, index),
    }))
  ), [extendedStepsConfig, isStepDisabled, payload]);

  const currentStep = useMemo(() => steps[activeIndex], [steps, activeIndex]);

  const value = useMemo(() => ({
    steps,
    currentStep,
    activeIndex,
    nextStep: () => dispatchStep({ next: true }),
    refreshStep: () => dispatchStep({ refresh: true }),
    jumpToStart: () => dispatchStep({ toStart: true }),
    jumpToStepByIndex: (index) => dispatchStep({ set: true, index }),
    jumpToStepByKey: (key) => dispatchStep({
      set: true,
      index: findStepIndexByKey(key),
    }),
    jumpToFirstIncompleteStep: () => dispatchStep({
      set: true,
      index: extendedStepsConfig.findIndex(
        (stepConfig) => !stepConfig.isCompleted(payload),
      ),
    }),
    jumpToSummary: () => dispatchStep({
      set: true,
      index: findStepIndexByKey(summaryPanelKey),
    }),
  }), [
    steps,
    currentStep,
    activeIndex,
    findStepIndexByKey,
    extendedStepsConfig,
    payload,
    summaryPanelKey,
  ]);

  return (
    <StepNavigationContext.Provider value={value}>
      {children}
    </StepNavigationContext.Provider>
  );
}

export const useStepNavigation = () => {
  const context = useContext(StepNavigationContext);
  if (!context) {
    throw new Error('useRegistration must be used within a RegistrationProvider');
  }
  return context;
};
