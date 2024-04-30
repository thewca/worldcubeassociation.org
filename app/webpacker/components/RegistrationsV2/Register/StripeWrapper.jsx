// Following https://github.com/stripe-samples/accept-a-payment/blob/main/payment-element/client/react-cra/src/Payment.js
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import React, { useCallback, useEffect, useState } from 'react';
import PaymentStep from './PaymentStep';
import { fetchWithAuthenticityToken } from '../../../lib/requests/fetchWithAuthenticityToken';
import { paymentDenominationUrl } from '../../../lib/requests/routes.js.erb';

export default function StripeWrapper({
  competitionInfo, stripePublishableKey, connectedAccountId, user,
}) {
  const [stripePromise, setStripePromise] = useState(null);
  const initialAmount = competitionInfo.base_entry_fee_lowest_denomination;
  const [amount, setAmount] = useState(initialAmount);
  const [donationAmount, setDonationAmount] = useState(0);

  useEffect(() => {
    setStripePromise(
      loadStripe(stripePublishableKey, {
        stripeAccount: connectedAccountId,
      }),
    );
  }, [connectedAccountId, stripePublishableKey]);

  const handleDonation = useCallback(async (_, { value: newDonationAmount }) => {
    const { api_amounts: { stripe: stripeAmount } } = await fetchWithAuthenticityToken(
      paymentDenominationUrl(initialAmount + newDonationAmount, competitionInfo.currency_iso),
    );
    setAmount(stripeAmount);
    setDonationAmount(newDonationAmount);
  }, [competitionInfo.currency_iso, initialAmount]);

  return (
    <>
      <h1>Payment</h1>
      { stripePromise && (
        <Elements
          stripe={stripePromise}
          options={{ amount, currency: competitionInfo.currency_code }}
        >
          <PaymentStep
            handleDonation={handleDonation}
            competitionInfo={competitionInfo}
            user={user}
            donationAmount={donationAmount}
          />
        </Elements>
      )}
    </>
  );
}
