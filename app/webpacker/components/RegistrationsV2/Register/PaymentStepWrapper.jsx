import React from 'react';
import { Message } from 'semantic-ui-react';
import { useQuery } from '@tanstack/react-query';
import StripePaymentStep from './StripePaymentStep';
import { useRegistration } from '../lib/RegistrationProvider';
import PaymentOverview from './PaymentOverview';
import { hasPassed } from '../../../lib/utils/dates';
import I18n from '../../../lib/i18n';
import getRegistrationPayments from '../api/payment/get/getRegistrationPayments';
import Loading from '../../Requests/Loading';

export default function PaymentStepWrapper({
  competitionInfo,
  stripePublishableKey,
  connectedAccountId,
  user,
  nextStep,
}) {
  const { registration } = useRegistration();

  const {
    data: payments,
    isLoading,
  } = useQuery({
    queryKey: ['payments', registration.id],
    queryFn: () => getRegistrationPayments(registration.id),
    select: (data) => data.charges,
  });

  if (isLoading) {
    return <Loading />;
  }

  if (payments.length > 0) {
    return <PaymentOverview payments={payments} />;
  }

  if (hasPassed(competitionInfo.registration_close)) {
    return (
      <Message color="red">{I18n.t('registrations.payment_form.errors.registration_closed')}</Message>
    );
  }

  // This will distinguish between Manual and Stripe Payments when #11299 is merged
  return (
    <StripePaymentStep
      competitionInfo={competitionInfo}
      connectedAccountId={connectedAccountId}
      nextStep={nextStep}
      stripePublishableKey={stripePublishableKey}
      user={user}
    />
  );
}
