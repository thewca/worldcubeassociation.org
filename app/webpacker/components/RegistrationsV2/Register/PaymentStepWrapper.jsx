import React from 'react';
import StripeWrapper from './StripeWrapper';
import ManualPaymentStep from './ManualPaymentStep';

export default function PaymentStepWrapper({
  competitionInfo,
  stripePublishableKey,
  connectedAccountId,
  user,
  nextStep,
}) {
  if (competitionInfo.payment_integration_type === 'stripe') {
    return (
      <StripeWrapper
        competitionInfo={competitionInfo}
        connectedAccountId={connectedAccountId}
        nextStep={nextStep}
        stripePublishableKey={stripePublishableKey}
        user={user}
      />
    );
  }
  if (competitionInfo.payment_integration_type === 'manual') {
    return (
      <ManualPaymentStep
        competitionInfo={competitionInfo}
        nextStep={nextStep}
        userInfo={user}
      />
    );
  }
}
