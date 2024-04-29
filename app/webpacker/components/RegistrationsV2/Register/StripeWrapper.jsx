// Following https://github.com/stripe-samples/accept-a-payment/blob/main/payment-element/client/react-cra/src/Payment.js
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import React, { useCallback, useEffect, useState } from 'react';
import PaymentStep from './PaymentStep';

export default function StripeWrapper({
  competitionInfo, stripePublishableKey, connectedAccountId,
}) {
  const [stripePromise, setStripePromise] = useState(null);
  const initialAmount = competitionInfo.base_entry_fee_lowest_denomination;
  const [amount, setAmount] = useState(initialAmount);

  useEffect(() => {
    setStripePromise(
      loadStripe(stripePublishableKey, {
        stripeAccount: connectedAccountId,
      }),
    );
  }, [connectedAccountId, stripePublishableKey]);

  const handleDonation = useCallback(async (donationAmount) => {
    // TODO: make sure this is always correct stripe money
    setAmount(initialAmount + donationAmount);
  }, [initialAmount]);

  return (
    <>
      <h1>Payment</h1>
      { stripePromise && (
        <Elements
          stripe={stripePromise}
          options={{ amount, currency: competitionInfo.currency_code }}
        >
          <PaymentStep handleDonation={handleDonation} />
        </Elements>
      )}
    </>
  );
}
