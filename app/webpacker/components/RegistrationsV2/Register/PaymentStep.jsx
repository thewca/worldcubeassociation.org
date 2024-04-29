import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import React, { useState } from 'react';
import { Input, Label } from 'semantic-ui-react';
import I18n from '../../../lib/i18n';
import { paymentFinishUrl } from '../../../lib/requests/routes.js.erb';
import { useDispatch } from '../../../lib/providers/StoreProvider';
import { setMessage } from './RegistrationMessage';
import fetchWithJWTToken from '../../../lib/requests/fetchWithJWTToken';

export default function PaymentStep({
  competitionInfo, user, handleDonation,
}) {
  const stripe = useStripe();
  const elements = useElements();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    setIsLoading(true);

    // Create the PaymentIntent and obtain clientSecret
    const res = await fetchWithJWTToken('/create-intent', {
      method: 'POST',
      body: {
        competition_id: `${competitionInfo.id}`,
      },
    });

    const { client_secret: clientSecret } = await res.json();

    const { error } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: {
        return_url: paymentFinishUrl(competitionInfo.id, user.id),
      },
    });

    // This point will only be reached if there is an immediate error when
    // confirming the payment. Otherwise, your customer will be redirected to
    // your `return_url`. For some payment methods like iDEAL, your customer will
    // be redirected to an intermediate site first to authorize the payment, then
    // redirected to the `return_url`.
    if (error.type === 'card_error' || error.type === 'validation_error') {
      dispatch(setMessage(error.message, 'error'));
    } else {
      dispatch(setMessage('An unexpected error occurred.', 'error'));
    }

    setIsLoading(false);
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit}>
      <PaymentElement id="payment-element" />
      <Input type="number" onChange={(_, data) => handleDonation(data.value)} placeholder="Amount">
        <Label> Donation</Label>
        <input min={0} />
        <Label>.00</Label>
      </Input>
      <button type="submit" disabled={isLoading || !stripe || !elements} id="submit">
        <span id="button-text">
          {isLoading ? (
            <div className="spinner" id="spinner" />
          ) : (
            I18n.t('registrations.payment_form.button_text')
          )}
        </span>
      </button>
    </form>
  );
}
