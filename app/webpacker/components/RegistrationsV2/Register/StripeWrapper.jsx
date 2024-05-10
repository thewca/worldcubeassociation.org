// Following https://github.com/stripe-samples/accept-a-payment/blob/main/payment-element/client/react-cra/src/Payment.js
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import React, { useCallback, useEffect, useState } from 'react';
import { Header } from 'semantic-ui-react';
import PaymentStep from './PaymentStep';
import { fetchJsonOrError } from '../../../lib/requests/fetchWithAuthenticityToken';
import { paymentDenominationUrl } from '../../../lib/requests/routes.js.erb';

const convertISOAmount = async (amount, currency) => {
  const { data } = await fetchJsonOrError(
    paymentDenominationUrl(amount, currency),
  );
  return data;
};

export default function StripeWrapper({
  competitionInfo,
  stripePublishableKey,
  connectedAccountId,
  user,
  registration,
  nextStep,
}) {
  const [stripePromise, setStripePromise] = useState(null);
  const initialAmount = competitionInfo.base_entry_fee_lowest_denomination;
  const [amount, setAmount] = useState(initialAmount);
  const [donationAmount, setDonationAmount] = useState(0);
  const [displayAmount, setDisplayAmount] = useState();

  useEffect(() => {
    async function fetchInitialAmount() {
      const { human_amount: humanAmount } = await convertISOAmount(
        initialAmount,
        competitionInfo.currency_code,
      );
      setDisplayAmount(humanAmount);
    }
    fetchInitialAmount();
  }, [competitionInfo.currency_code, initialAmount]);

  useEffect(() => {
    setStripePromise(
      loadStripe(stripePublishableKey, {
        stripeAccount: connectedAccountId,
      }),
    );
  }, [connectedAccountId, stripePublishableKey]);
  const handleDonation = useCallback(async (_, { value: newDonationAmount }) => {
    const {
      api_amounts: { stripe: stripeAmount },
      human_amount: humanAmount,
    } = await convertISOAmount(initialAmount + newDonationAmount, competitionInfo.currency_code);
    setAmount(stripeAmount);
    setDonationAmount(newDonationAmount);
    setDisplayAmount(humanAmount);
  }, [competitionInfo.currency_code, initialAmount]);

  return (
    <>
      <Header>Payment</Header>
      { stripePromise && (
        <Elements
          stripe={stripePromise}
          options={{ amount, currency: competitionInfo.currency_code.toLowerCase(), mode: 'payment' }}
        >
          <PaymentStep
            handleDonation={handleDonation}
            competitionInfo={competitionInfo}
            user={user}
            donationAmount={donationAmount}
            displayAmount={displayAmount}
            registration={registration}
            nextStep={nextStep}
          />
        </Elements>
      )}
    </>
  );
}
