import RegistrationRequirements from '../Register/RegistrationRequirements';
import CompetingStep from '../Register/CompetingStep';
import StripeWrapper from '../Register/StripeWrapper';
import RegistrationOverview from '../Register/RegistrationOverview';

export const requirementsStepConfig = {
  key: 'requirements',
  i18nKey: 'competitions.registration_v2.register.panel.requirements',
  component: RegistrationRequirements,
  shouldShowCompletedAnd: () => true,
  shouldShowCompletedOr: (isRegistered) => isRegistered,
  shouldBeDisabledAnd: () => false,
  shouldBeDisabledOr: (isRegistered) => isRegistered,
};

export const competingStepConfig = {
  key: 'competing',
  i18nKey: 'competitions.registration_v2.register.panel.competing',
  component: CompetingStep,
  shouldShowCompletedAnd: () => true,
  shouldShowCompletedOr: (isRegistered) => isRegistered,
  shouldBeDisabledAnd: () => false,
  shouldBeDisabledOr: () => false,
};

export const paymentStepConfig = {
  key: 'payment',
  i18nKey: 'competitions.registration_v2.register.panel.payment',
  component: StripeWrapper,
  shouldShowCompletedAnd: (isRegistered, hasPaid) => hasPaid,
  shouldShowCompletedOr: (isRegistered, hasPaid) => hasPaid,
  shouldBeDisabledAnd: () => false,
  shouldBeDisabledOr: (
    isRegistered,
    hasPaid,
    registrationCurrentlyOpen,
  ) => hasPaid || !registrationCurrentlyOpen,
};

export const registrationOverviewConfig = {
  key: 'approval',
  i18nKey: 'competitions.registration_v2.register.panel.approval',
  component: RegistrationOverview,
  shouldShowCompletedAnd: () => true,
  shouldShowCompletedOr: (isRegistered, hasPaid, isAccepted) => isAccepted,
  shouldBeDisabledAnd: (isRegistered) => !isRegistered,
  shouldBeDisabledOr: () => false,
};

export const availableSteps = [requirementsStepConfig,
  competingStepConfig, paymentStepConfig, registrationOverviewConfig];
