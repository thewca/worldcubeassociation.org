import RegistrationRequirements from '../Register/RegistrationRequirements';
import CompetingStep from '../Register/CompetingStep';
import PaymentWrapper from '../Register/PaymentStepWrapper';
import RegistrationOverview from '../Register/RegistrationOverview';

export const requirementsStepConfig = {
  key: 'requirements',
  i18nKey: 'competitions.registration_v2.register.panel.requirements',
  Component: RegistrationRequirements,
  isCompleted: (stepPayload) => stepPayload.registration.regRequirements?.infoAcknowledged
      || stepPayload.isRegistered,
};

export const competingStepConfig = {
  key: 'competing',
  i18nKey: 'competitions.registration_v2.register.panel.competing',
  Component: CompetingStep,
  isCompleted: (stepPayload) => stepPayload.isRegistered,
};

export const paymentStepConfig = {
  key: 'payment',
  i18nKey: 'competitions.registration_v2.register.panel.payment',
  Component: PaymentWrapper,
  isCompleted: (stepPayload) => stepPayload.hasPaid,
};

export const registrationOverviewConfig = {
  key: 'approval',
  i18nKey: 'competitions.registration_v2.register.panel.approval',
  Component: RegistrationOverview,
  isCompleted: (stepPayload) => stepPayload.isAccepted,
};

export const availableSteps = [
  requirementsStepConfig,
  competingStepConfig,
  paymentStepConfig,
  registrationOverviewConfig,
];
