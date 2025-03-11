import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import React, { useEffect, useState } from 'react';
import {
  Button,
  Checkbox,
  Divider,
  Form,
  FormField,
  Header,
  Label,
  Message,
  Segment,
} from 'semantic-ui-react';
import { paymentFinishUrl } from '../../../lib/requests/routes.js.erb';
import { useDispatch } from '../../../lib/providers/StoreProvider';
import { showMessage } from './RegistrationMessage';
import Loading from '../../Requests/Loading';
import I18n from '../../../lib/i18n';
import useCheckboxState from '../../../lib/hooks/useCheckboxState';
import { hasPassed } from '../../../lib/utils/dates';
import AutonumericField from '../../wca/FormBuilder/input/AutonumericField';
import getPaymentTicket from '../api/payment/get/getPaymentTicket';
import { useRegistration } from '../lib/RegistrationProvider';

export default function PaymentStep({
  competitionInfo,
  setDonationAmount,
  donationAmount,
  displayAmount,
  nextStep,
  conversionFetching,
}) {
  const stripe = useStripe();
  const elements = useElements();
  const dispatch = useDispatch();

  const { registration } = useRegistration();

  const [isLoading, setIsLoading] = useState(false);
  const [isDonationChecked, setDonationChecked] = useCheckboxState(false);

  useEffect(() => {
    // TODO When we add per Event Payment this logic needs to also check
    //  if an additional payment is needed
    if (registration?.payment?.has_paid) {
      nextStep();
    }
  }, [nextStep, registration]);

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
    const data = await getPaymentTicket(competitionInfo, donationAmount);

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
  if (hasPassed(competitionInfo.registration_close)) {
    return (
      <Message color="red">{I18n.t('registrations.payment_form.errors.registration_closed')}</Message>
    );
  }

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
                setDonationAmount(0);
              }}
              label={I18n.t('registrations.payment_form.labels.show_donation')}
            />
            { isDonationChecked && (
            <AutonumericField
              id="donationInputField"
              onChange={(_, { value }) => setDonationAmount(value)}
              currency={competitionInfo.currency_code}
              value={donationAmount}
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
