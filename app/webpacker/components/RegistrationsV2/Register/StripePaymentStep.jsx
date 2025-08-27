// Following https://github.com/stripe-samples/accept-a-payment/blob/main/payment-element/client/react-cra/src/Payment.js
import {
  Elements, PaymentElement, useElements, useStripe,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import React, { useMemo, useState } from 'react';
import {
  Button, Checkbox, Divider, Form, FormField, Header, Label, Message, Segment,
} from 'semantic-ui-react';
import { useQuery } from '@tanstack/react-query';
import I18n from '../../../lib/i18n';
import { fetchJsonOrError } from '../../../lib/requests/fetchWithAuthenticityToken';
import { paymentDenominationUrl, paymentFinishUrl } from '../../../lib/requests/routes.js.erb';
import { useRegistration } from '../lib/RegistrationProvider';
import { useDispatch } from '../../../lib/providers/StoreProvider';
import useCheckboxState from '../../../lib/hooks/useCheckboxState';
import getPaymentTicket from '../api/payment/get/getPaymentTicket';
import { showMessage } from './RegistrationMessage';
import AutonumericField from '../../wca/FormBuilder/input/AutonumericField';
import Loading from '../../Requests/Loading';

const convertISOAmount = async (competitionId, userId, isoDonationAmount) => {
  const { data } = await fetchJsonOrError(
    paymentDenominationUrl(competitionId, userId, isoDonationAmount),
  );
  return data;
};

export default function Wrapper({
  competitionInfo,
  stripePublishableKey,
  connectedAccountId,
  user,
}) {
  const stripePromise = useMemo(() => loadStripe(stripePublishableKey, {
    stripeAccount: connectedAccountId,
  }), [stripePublishableKey, connectedAccountId]);

  const initialAmount = competitionInfo.base_entry_fee_lowest_denomination;
  const [isoDonationAmount, setIsoDonationAmount] = useState(0);

  const {
    data, isFetching,
  } = useQuery({
    queryFn: () => convertISOAmount(competitionInfo.id, user.id, isoDonationAmount),
    queryKey: ['displayAmount', isoDonationAmount, competitionInfo.id, user.id],
  });

  return (
    <>
      <Header>Payment</Header>
      <Message positive>
        {I18n.t('registrations.payment_form.hints.payment_button')}
      </Message>
      { isoDonationAmount > initialAmount && (
      <Message warning>
        {I18n.t('registrations.payment_form.alerts.amount_rather_high')}
      </Message>
      )}
      { stripePromise && (
        <Elements
          stripe={stripePromise}
          options={{ amount: data?.api_amounts.stripe ?? initialAmount, currency: competitionInfo.currency_code.toLowerCase(), mode: 'payment' }}
        >
          <PaymentStep
            competitionInfo={competitionInfo}
            setIsoDonationAmount={setIsoDonationAmount}
            isoDonationAmount={isoDonationAmount}
            displayAmount={data?.human_amount}
            conversionFetching={isFetching}
          />
        </Elements>
      )}
    </>
  );
}

function PaymentStep({
  competitionInfo,
  setIsoDonationAmount,
  isoDonationAmount,
  displayAmount,
  conversionFetching,
}) {
  const stripe = useStripe();
  const elements = useElements();
  const dispatch = useDispatch();

  const { registrationId } = useRegistration();

  const [isLoading, setIsLoading] = useState(false);
  const [isDonationChecked, setDonationChecked] = useCheckboxState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    setIsLoading(true);

    // Call submit before doing any async work as per Stripe Documentation
    await elements.submit();

    // Create the PaymentIntent and obtain clientSecret
    const data = await getPaymentTicket(registrationId, isoDonationAmount);

    const { client_secret: clientSecret } = data;

    const { error } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: {
        return_url: paymentFinishUrl(competitionInfo.id, 'stripe'),
      },
    });

    // This point will only be reached if there is an immediate error when
    // confirming the payment. Otherwise, your customer will be redirected to
    // your `return_url`. For some payment methods like iDEAL, your customer will
    // be redirected to an intermediate site first to authorize the payment, then
    // redirected to the `return_url`.
    if (error) {
      // i18n-tasks-use t('registrations.payment_form.errors.generic.failed')
      dispatch(showMessage('registrations.payment_form.errors.generic.failed', 'error', {
        provider: I18n.t('payments.payment_providers.stripe'),
      }));

      console.error(error);
    }

    setIsLoading(false);
  };

  return (
    <Segment>
      <Form id="payment-form" onSubmit={handleSubmit}>
        <PaymentElement id="payment-element" />
        <Divider />
        { competitionInfo.enable_donations && (
          <FormField>
            <Checkbox
              id="useDonationCheckbox"
              value={isDonationChecked}
              onChange={(event, data) => {
                setDonationChecked(event, data);
                setIsoDonationAmount(0);
              }}
              label={I18n.t('registrations.payment_form.labels.show_donation')}
            />
            { isDonationChecked && (
              <AutonumericField
                id="donationInputField"
                onChange={(_, { value }) => setIsoDonationAmount(value)}
                currency={competitionInfo.currency_code}
                value={isoDonationAmount}
                label={(
                  <Label>
                    {I18n.t('registrations.payment_form.labels.donation')}
                  </Label>
                )}
              />
            )}
          </FormField>
        )}
        { isLoading
          ? <Loading />
          : (
            <>
              <Header size="small" id="money-subtotal">
                {I18n.t('registrations.payment_form.labels.subtotal')}
                :
                {' '}
                {displayAmount}
              </Header>
              <Divider hidden />
              <Button type="submit" primary disabled={isLoading || conversionFetching || !stripe || !elements} id="submit">
                {I18n.t('registrations.payment_form.button_text')}
              </Button>
            </>
          )}
      </Form>
    </Segment>
  );
}
