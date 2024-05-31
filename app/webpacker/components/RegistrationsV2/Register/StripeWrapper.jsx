// Following https://github.com/stripe-samples/accept-a-payment/blob/main/payment-element/client/react-cra/src/Payment.js
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import React, { useCallback, useEffect, useState } from 'react';
import { Header } from 'semantic-ui-react';
import { useQuery } from '@tanstack/react-query';
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
  const [donationAmount, setDonationAmount] = useState(0);

  const {
    data, isFetching,
  } = useQuery({
    queryFn: () => convertISOAmount(initialAmount + donationAmount, competitionInfo.currency_code),
    queryKey: ['displayAmount', initialAmount + donationAmount, competitionInfo.currency_code],
  });

  useEffect(() => {
    setStripePromise(
      loadStripe(stripePublishableKey, {
        stripeAccount: connectedAccountId,
      }),
    );
  }, [connectedAccountId, stripePublishableKey]);

  return (
    <>
      <Header>Payment</Header>
      { stripePromise && (
        <Elements
          stripe={stripePromise}
          options={{ amount: data?.api_amounts.stripe ?? initialAmount, currency: competitionInfo.currency_code.toLowerCase(), mode: 'payment' }}
        >
          <PaymentStep
            setDonationAmount={setDonationAmount}
            competitionInfo={competitionInfo}
            user={user}
            donationAmount={donationAmount}
            displayAmount={data?.human_amount}
            registration={registration}
            nextStep={nextStep}
            conversionFetching={isFetching}
          />
        </Elements>
      )}
    </>
  );
}
