import RegistrationRequirements from '../Register/RegistrationRequirements';
import CompetingStep from '../Register/CompetingStep';
import StripeWrapper from '../Register/StripeWrapper';
import RegistrationOverview from '../Register/RegistrationOverview';

export const requirementsStepConfig = {
  key: 'requirements',
  i18nKey: 'competitions.registration_v2.register.panel.requirements',
  component: RegistrationRequirements,
  shouldShowCompleted: (isRegistered, hasPaid, isAccepted, index) => index > 0,
  shouldBeDisabled: (isRegistered, hasPaid, activeIndex) => activeIndex !== 0,
};

export const competingStepConfig = {
  key: 'competing',
  i18nKey: 'competitions.registration_v2.register.panel.competing',
  component: CompetingStep,
  shouldShowCompleted: (isRegistered) => isRegistered,
  shouldBeDisabled: (isRegistered, hasPaid, activeIndex, index) => index > activeIndex,
};

export const paymentStepConfig = {
  key: 'payment',
  i18nKey: 'competitions.registration_v2.register.panel.payment',
  component: StripeWrapper,
  shouldShowCompleted: (isRegistered, hasPaid) => hasPaid,
  shouldBeDisabled: (
    isRegistered,
    hasPaid,
    activeIndex,
    index,
    registrationCurrentlyOpen,
  ) => (!hasPaid && index > activeIndex) || !registrationCurrentlyOpen,
};

export const registrationOverviewConfig = {
  key: 'approval',
  i18nKey: 'competitions.registration_v2.register.panel.approval',
  component: RegistrationOverview,
  shouldShowCompleted: (isRegistered, hasPaid, isAccepted) => isAccepted,
  shouldBeDisabled: (isRegistered) => !isRegistered,
};

// eslint-disable-next-line import/prefer-default-export
export const availableSteps = [requirementsStepConfig,
  competingStepConfig, paymentStepConfig, registrationOverviewConfig];
