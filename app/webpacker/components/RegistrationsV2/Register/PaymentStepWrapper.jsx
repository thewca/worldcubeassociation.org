import React from 'react';
import { Message } from 'semantic-ui-react';
import { useQuery } from '@tanstack/react-query';
import StripePaymentStep from './StripePaymentStep';
import { useRegistration } from '../lib/RegistrationProvider';
import { useStepNavigation } from '../lib/StepNavigationProvider';
import PaymentOverview from './PaymentOverview';
import { hasPassed } from '../../../lib/utils/dates';
import I18n from '../../../lib/i18n';
import getRegistrationPayments from '../api/payment/get/getRegistrationPayments';
import Loading from '../../Requests/Loading';

export default function PaymentStepWrapper({
  competitionInfo,
  user,
}) {
  const { registrationId } = useRegistration();

  const { currentStep: { parameters: currentStepParameters } } = useStepNavigation();
  const { stripePublishableKey, connectedAccountId } = currentStepParameters;

  const {
    data: payments,
    isLoading,
  } = useQuery({
    queryKey: ['payments', registrationId],
    queryFn: () => getRegistrationPayments(registrationId),
    select: (data) => data.charges,
    enabled: !!registrationId,
  });

  if (isLoading) {
    return <Loading />;
  }

  if (payments.length > 0) {
    return (
      <PaymentOverview
        payments={payments}
        competitionInfo={competitionInfo}
        connectedAccountId={connectedAccountId}
        stripePublishableKey={stripePublishableKey}
        user={user}
      />
    );
  }

  if (hasPassed(competitionInfo.registration_close)) {
    return (
      <Message error>{I18n.t('registrations.payment_form.errors.registration_closed')}</Message>
    );
  }

  // This will distinguish between Manual and Stripe Payments when #11299 is merged
  return (
    <StripePaymentStep
      competitionInfo={competitionInfo}
      connectedAccountId={connectedAccountId}
      stripePublishableKey={stripePublishableKey}
      user={user}
    />
  );
}
