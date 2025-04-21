import RegistrationRequirements from '../Register/RegistrationRequirements';
import CompetingStep from '../Register/CompetingStep';
import StripeWrapper from '../Register/StripeWrapper';
import RegistrationOverview from '../Register/RegistrationOverview';

export const requirementsStepConfig = {
  key: 'requirements',
  i18nKey: 'competitions.registration_v2.register.panel.requirements',
  Component: RegistrationRequirements,
  isCompleted: (stepPayload) => true, // TODO transmit this information as a dummy
  isEditable: false,
};

export const competingStepConfig = {
  key: 'competing',
  i18nKey: 'competitions.registration_v2.register.panel.competing',
  Component: CompetingStep,
  isCompleted: (stepPayload) => stepPayload.isRegistered,
  isEditable: true,
};

export const paymentStepConfig = {
  key: 'payment',
  i18nKey: 'competitions.registration_v2.register.panel.payment',
  Component: StripeWrapper,
  isCompleted: (stepPayload) => stepPayload.hasPaid,
  isEditable: true,
};

export const registrationOverviewConfig = {
  key: 'approval',
  i18nKey: 'competitions.registration_v2.register.panel.approval',
  Component: RegistrationOverview,
  isCompleted: (stepPayload) => stepPayload.isAccepted,
  isEditable: true,
};

export const availableSteps = [
  requirementsStepConfig,
  competingStepConfig,
  paymentStepConfig,
  registrationOverviewConfig,
];
