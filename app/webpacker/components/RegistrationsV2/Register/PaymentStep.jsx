import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import React, { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CompetitionContext } from '../Context/competition_context';
import { UserContext } from '../Context/user_context';
import setMessage from '../ui/events/messages';
import { paymentFinishRoute } from '../../../lib/requests/routes.js.erb';

export default function PaymentStep() {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const { competitionInfo } = useContext(CompetitionContext);
  const { user } = useContext(UserContext);

  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: paymentFinishRoute(competitionInfo.id, user.id),
      },
    });

    // This point will only be reached if there is an immediate error when
    // confirming the payment. Otherwise, your customer will be redirected to
    // your `return_url`. For some payment methods like iDEAL, your customer will
    // be redirected to an intermediate site first to authorize the payment, then
    // redirected to the `return_url`.
    if (error.type === 'card_error' || error.type === 'validation_error') {
      setMessage(error.message, 'error');
    } else {
      setMessage('An unexpected error occurred.', 'error');
    }

    setIsLoading(false);
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit}>
      <PaymentElement id="payment-element" />
      <button type="submit" disabled={isLoading || !stripe || !elements} id="submit">
        <span id="button-text">
          {isLoading ? (
            <div className="spinner" id="spinner" />
          ) : (
            t('registrations.payment_form.button_text')
          )}
        </span>
      </button>
    </form>
  );
}
