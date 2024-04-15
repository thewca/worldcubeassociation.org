// Following https://github.com/stripe-samples/accept-a-payment/blob/main/payment-element/client/react-cra/src/Payment.js
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import I18n from '../../../lib/i18n';
import getStripeConfig from '../api/payment/get/get_stripe_config';
import getPaymentId from '../api/registration/get/get_payment_intent';
import PaymentStep from './PaymentStep';
import { useDispatch } from '../../../lib/providers/StoreProvider';
import { setMessage } from './RegistrationMessage';

export default function StripeWrapper({ competitionInfo }) {
  const [stripePromise, setStripePromise] = useState(null);
  const dispatch = useDispatch();
  const {
    data: paymentInfo,
    isLoading: isPaymentIdLoading,
    isError,
  } = useQuery({
    queryKey: ['payment-secret', competitionInfo.id],
    queryFn: () => getPaymentId(competitionInfo.id),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    refetchOnMount: 'always',
    onError: (data) => {
      const { error } = data.json;
      dispatch(setMessage(
        error
          ? I18n.t(`competitions.registration_v2.errors.${error}`)
          : I18n.t('registrations.flash.failed') + data.message,
        'negative',
      ));
    },
  });

  const { data: config, isLoading: isConfigLoading } = useQuery({
    queryKey: ['payment-config', competitionInfo.id, paymentInfo?.id],
    queryFn: () => getStripeConfig(competitionInfo.id, paymentInfo?.id),
    onError: (err) => setMessage(err.error, 'error'),
    enabled:
      !isPaymentIdLoading && !isError && paymentInfo?.status !== 'succeeded',
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    refetchOnMount: 'always',
  });

  useEffect(() => {
    if (!isConfigLoading) {
      setStripePromise(
        loadStripe(config.stripe_publishable_key, {
          stripeAccount: config.connected_account_id,
        }),
      );
    }
  }, [
    config?.connected_account_id,
    config?.stripe_publishable_key,
    isConfigLoading,
  ]);

  return (
    <>
      <h1>Payment</h1>
      {paymentInfo?.status === 'succeeded' && (
        <div>Your payment has been successfully processed.</div>
      )}
      {!isPaymentIdLoading && stripePromise && !isError && (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret: config.client_secret,
          }}
        >
          <PaymentStep />
        </Elements>
      )}
    </>
  );
}
