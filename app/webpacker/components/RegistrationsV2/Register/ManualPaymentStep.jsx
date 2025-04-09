import React, { useCallback } from 'react';
import {
  Form,
  Message,
  Segment,
} from 'semantic-ui-react';
import { useMutation } from '@tanstack/react-query';
import I18n from '../../../lib/i18n';
import { hasPassed } from '../../../lib/utils/dates';
import useInputState from '../../../lib/hooks/useInputState';
import { fetchJsonOrError } from '../../../lib/requests/fetchWithAuthenticityToken';
import { addPaymentReferenceUrl } from '../../../lib/requests/routes.js.erb';

export default function ManualPaymentStep({
  userInfo,
  competitionInfo,
  paymentInfo,
  nextStep,
}) {
  const [paymentReference, setPaymentReference] = useInputState('');

  const { mutate } = useMutation({
    mutationFn: ({ reference }) => fetchJsonOrError(
      addPaymentReferenceUrl(competitionInfo.id, userInfo.id),
      {
        method: 'POST',
        body: JSON.stringify({ paymentReference: reference }),
      },
    ),
    onSuccess: () => nextStep(),
  });

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    mutate({ reference: paymentReference });
  }, [mutate, paymentReference]);

  if (hasPassed(competitionInfo.registration_close)) {
    return (
      <Message color="red">{I18n.t('registrations.payment_form.errors.registration_closed')}</Message>
    );
  }

  return (
    <Segment>
      {paymentInfo.payment_info}
      <Form id="manual-payment-form" onSubmit={handleSubmit}>
        <Form.Field>
          <label htmlFor="paymentReference">{paymentInfo.payment_reference}</label>
          <Form.Input id="paymentReference" value={paymentReference} onChange={setPaymentReference} />
        </Form.Field>
      </Form>
    </Segment>
  );
}
