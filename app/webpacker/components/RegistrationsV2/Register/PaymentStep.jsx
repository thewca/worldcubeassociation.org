import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import React, { useState } from 'react';
import {
  Button,
  Checkbox,
  Divider,
  Form,
  FormField,
  Label,
  Segment,
} from 'semantic-ui-react';
import { paymentFinishUrl, wcaRegistrationUrl } from '../../../lib/requests/routes.js.erb';
import { useDispatch } from '../../../lib/providers/StoreProvider';
import { setMessage } from './RegistrationMessage';
import fetchWithJWTToken from '../../../lib/requests/fetchWithJWTToken';
import Loading from '../../Requests/Loading';
import i18n from '../../../lib/i18n';
import useCheckboxState from '../../../lib/hooks/useCheckboxState';
import AutonumericField from '../../wca/FormBuilder/input/AutonumericField';

export default function PaymentStep({
  competitionInfo, user, handleDonation, donationAmount, displayAmount,
}) {
  const stripe = useStripe();
  const elements = useElements();
  const dispatch = useDispatch();
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
    const { data } = await fetchWithJWTToken(`${wcaRegistrationUrl}/api/v1/${competitionInfo.id}/payment?donation_iso=${donationAmount}`, {
      method: 'GET',
    });

    const { client_secret: clientSecret } = data;

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
    if (error) {
      dispatch(setMessage('registrations.payment_form.errors.stripe_failed', 'error'));
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
            <Checkbox value={isDonationChecked} onChange={setDonationChecked} label={i18n.t('registrations.payment_form.labels.show_donation')} />
            { isDonationChecked && (
            <AutonumericField
              onChange={handleDonation}
              currency={competitionInfo.currency_code}
              value={donationAmount}
              label={(
                <Label>
                  {i18n.t('registrations.payment_form.labels.donation')}
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
              <div>
                <b>
                  Subtotal:
                  {' '}
                  {displayAmount}
                </b>
              </div>
              <FormField />
              <Button attached type="submit" primary disabled={isLoading || !stripe || !elements} id="submit">
                {i18n.t('registrations.payment_form.button_text')}
              </Button>
            </>
          )}
      </Form>
    </Segment>
  );
}
