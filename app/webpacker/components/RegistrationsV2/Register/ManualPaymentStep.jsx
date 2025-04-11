import React, { useCallback } from 'react';
import {
  Form, Header,
  Message,
  Segment,
} from 'semantic-ui-react';
import { useMutation } from '@tanstack/react-query';
import I18n from '../../../lib/i18n';
import { hasPassed } from '../../../lib/utils/dates';
import useInputState from '../../../lib/hooks/useInputState';
import useCheckboxState from '../../../lib/hooks/useCheckboxState';
import Markdown from '../../Markdown';
import { useRegistration } from '../lib/RegistrationProvider';
import submitPaymentReference from '../api/registration/post/submit_payment_reference';

export default function ManualPaymentStep({
  userInfo,
  competitionInfo,
}) {
  const { hasPaid, registration, refetchRegistration } = useRegistration();

  const [paymentReference, setPaymentReference] = useInputState(hasPaid ? registration.payment.payment_reference : '');
  const [paymentConfirmation, setPaymentConfirmation] = useCheckboxState(hasPaid);

  const { mutate, isPending } = useMutation({
    mutationFn: submitPaymentReference,
    onSuccess: () => refetchRegistration(),
  });

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    mutate({ reference: paymentReference, userId: userInfo.id, competitionId: competitionInfo.id });
  }, [competitionInfo.id, mutate, paymentReference, userInfo.id]);

  if (hasPassed(competitionInfo.registration_close)) {
    return (
      <Message color="red">{I18n.t('registrations.payment_form.errors.registration_closed')}</Message>
    );
  }

  return (
    <Segment>
      <Header as="h2">{I18n.t('competitions.registration_v2.list.payment.payment_info')}</Header>
      <Message>
        <Markdown id="paymentInfo" md={competitionInfo.manual_payment_details.payment_info} />
      </Message>
      <Form id="manual-payment-form" onSubmit={handleSubmit}>
        <Form.Field required disabled={hasPaid}>
          <label htmlFor="paymentReference">{I18n.t('competitions.registration_v2.list.payment.payment_reference')}</label>
          <Form.Checkbox id="paymentConfirm" onChange={setPaymentConfirmation} checked={paymentConfirmation} label={I18n.t('competitions.registration_v2.list.payment.confirmation')} />
        </Form.Field>
        <Form.Field required disabled={hasPaid}>
          <label htmlFor="paymentReference">{competitionInfo.manual_payment_details.payment_reference}</label>
          <Form.Input id="paymentReference" value={paymentReference} onChange={setPaymentReference} />
        </Form.Field>
        <Form.Button type="submit" disabled={isPending || hasPaid}>
          {I18n.t('competitions.registration_v2.list.payment.submit')}
        </Form.Button>
      </Form>
    </Segment>
  );
}
